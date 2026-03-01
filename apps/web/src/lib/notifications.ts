/**
 * Sprint 3.2 — Email Notification System
 *
 * Status change notifications: when a request's status changes, email all watchers.
 * Uses Resend API with deduplication (in-memory, 5-min TTL).
 *
 * Templates:
 *   - statusUpdate: "Status update on {requestTitle}"
 *
 * Deduplication:
 *   Since Next.js API routes can be serverless, we use an in-memory Map with a 5-min TTL.
 *   For multi-instance deployments, replace with Redis or DB-based dedup.
 */

import { Resend } from "resend";
import { db, watchers, requests, boards, eq } from "@feedbackkit/db";

// ─── Resend Client ────────────────────────────────────────────────────────────

let _resend: Resend | null = null;

function getResend(): Resend {
  if (_resend) return _resend;
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");
  _resend = new Resend(apiKey);
  return _resend;
}

const FROM_EMAIL =
  process.env["RESEND_FROM_EMAIL"] ?? "FeedbackKit <noreply@feedbackkit.threestack.io>";

// ─── Deduplication ────────────────────────────────────────────────────────────

const DEDUP_TTL_MS = 5 * 60 * 1000; // 5 minutes

const _dedupCache = new Map<string, number>();

function isDuplicate(key: string): boolean {
  const lastSent = _dedupCache.get(key);
  if (!lastSent) return false;
  if (Date.now() - lastSent < DEDUP_TTL_MS) return true;
  _dedupCache.delete(key);
  return false;
}

function markSent(key: string): void {
  _dedupCache.set(key, Date.now());
  // Cleanup old entries periodically
  if (_dedupCache.size > 500) {
    const now = Date.now();
    for (const [k, ts] of _dedupCache.entries()) {
      if (now - ts > DEDUP_TTL_MS) _dedupCache.delete(k);
    }
  }
}

// ─── Status Display Labels ────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  under_review: "Under Review",
  planned: "Planned",
  in_progress: "In Progress",
  shipped: "Shipped 🚀",
  wont_do: "Won't Do",
};

// ─── Email Template: Status Update ────────────────────────────────────────────

function renderStatusUpdateEmail(opts: {
  requestTitle: string;
  newStatus: string;
  boardName: string;
  requestUrl: string;
}): { subject: string; html: string; text: string } {
  const statusLabel = STATUS_LABELS[opts.newStatus] ?? opts.newStatus;

  const subject = `Status update: "${opts.requestTitle}" is now ${statusLabel}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f5f7; margin: 0; padding: 40px 20px; }
    .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #6366f1; padding: 24px 32px; }
    .header h1 { color: white; font-size: 18px; font-weight: 600; margin: 0; }
    .body { padding: 32px; }
    .status-badge { display: inline-block; padding: 6px 14px; border-radius: 20px; background: #f0f1ff; color: #6366f1; font-size: 14px; font-weight: 600; margin-bottom: 20px; }
    .title { font-size: 20px; font-weight: 700; color: #1a1a2e; margin-bottom: 12px; }
    .board { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
    .cta { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 500; }
    .footer { padding: 20px 32px; border-top: 1px solid #f0f0f0; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>FeedbackKit</h1>
    </div>
    <div class="body">
      <div class="status-badge">${statusLabel}</div>
      <div class="title">${opts.requestTitle}</div>
      <div class="board">on ${opts.boardName}</div>
      <p style="color:#4b5563;font-size:15px;margin-bottom:24px;">
        The status of a feature request you're watching has been updated.
      </p>
      <a href="${opts.requestUrl}" class="cta">View Request →</a>
    </div>
    <div class="footer">
      You're receiving this because you voted or watched this request.
      This email was sent via FeedbackKit.
    </div>
  </div>
</body>
</html>`;

  const text = `FeedbackKit — Status Update

"${opts.requestTitle}" on ${opts.boardName} is now: ${statusLabel}

View the request: ${opts.requestUrl}

---
You're receiving this because you voted or watched this request.`;

  return { subject, html, text };
}

// ─── Main: Notify Watchers on Status Change ───────────────────────────────────

export interface NotifyWatchersOptions {
  requestId: string;
  newStatus: string;
  previousStatus?: string | null;
}

export interface NotifyWatchersResult {
  sent: number;
  skipped: number;
  errors: number;
}

/**
 * Sends status update emails to all watchers of a request.
 * Skips sending if status didn't actually change or within 5-min dedup window.
 */
export async function notifyWatchersOnStatusChange(
  opts: NotifyWatchersOptions
): Promise<NotifyWatchersResult> {
  const { requestId, newStatus, previousStatus } = opts;

  // Skip if status didn't change
  if (previousStatus === newStatus) {
    return { sent: 0, skipped: 0, errors: 0 };
  }

  // Deduplication: one notification per (requestId + newStatus) per 5 minutes
  const dedupKey = `status-notify:${requestId}:${newStatus}`;
  if (isDuplicate(dedupKey)) {
    console.log(`[notifications] Deduped: ${dedupKey}`);
    return { sent: 0, skipped: 1, errors: 0 };
  }

  // Load request + board info
  const [requestRow] = await db
    .select({
      id: requests.id,
      title: requests.title,
      boardId: requests.boardId,
    })
    .from(requests)
    .where(eq(requests.id, requestId))
    .limit(1);

  if (!requestRow) {
    console.warn(`[notifications] Request ${requestId} not found`);
    return { sent: 0, skipped: 0, errors: 1 };
  }

  const [board] = await db
    .select({ name: boards.name, slug: boards.slug })
    .from(boards)
    .where(eq(boards.id, requestRow.boardId))
    .limit(1);

  if (!board) {
    console.warn(`[notifications] Board for request ${requestId} not found`);
    return { sent: 0, skipped: 0, errors: 1 };
  }

  // Fetch all watchers for this request
  const watcherList = await db
    .select({ email: watchers.email })
    .from(watchers)
    .where(eq(watchers.requestId, requestId));

  if (watcherList.length === 0) {
    console.log(`[notifications] No watchers for request ${requestId}`);
    return { sent: 0, skipped: 0, errors: 0 };
  }

  const appUrl =
    process.env["NEXT_PUBLIC_APP_URL"] ?? "https://app.feedbackkit.threestack.io";
  const requestUrl = `${appUrl}/b/${board.slug}/${requestId}`;

  const { subject, html, text } = renderStatusUpdateEmail({
    requestTitle: requestRow.title,
    newStatus,
    boardName: board.name,
    requestUrl,
  });

  // Send emails via Resend (batch in groups of 50)
  const resend = getResend();
  let sent = 0;
  let errors = 0;
  const skipped = 0;

  const emails = watcherList.map((w) => w.email);

  for (let i = 0; i < emails.length; i += 50) {
    const batch = emails.slice(i, i + 50);

    // Send individually to avoid disclosure of other watchers' emails
    const sendPromises = batch.map(async (email) => {
      try {
        const { error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject,
          html,
          text,
          tags: [
            { name: "type", value: "status-update" },
            { name: "request_id", value: requestId },
            { name: "status", value: newStatus },
          ],
        });

        if (error) {
          console.error(`[notifications] Resend error for ${email}:`, error.message);
          errors++;
        } else {
          sent++;
        }
      } catch (err) {
        console.error(`[notifications] Exception for ${email}:`, err);
        errors++;
      }
    });

    await Promise.allSettled(sendPromises);
  }

  if (sent > 0) {
    markSent(dedupKey);
    console.log(
      `[notifications] ✅ Sent ${sent} status-update emails for request ${requestId} (status: ${newStatus})`
    );
  }

  return { sent, skipped, errors };
}
