export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db, requests, boards, votes, watchers, voteTokens, eq, and } from "@feedbackkit/db";
import { z } from "zod";
import { randomBytes } from "crypto";
import { checkRateLimit } from "@/lib/rate-limit";
import { Resend } from "resend";

const voteSchema = z.object({
  email: z.string().email("Valid email required"),
});

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// POST /api/requests/:id/vote — initiate email-verified vote
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limit: 5 votes per IP per hour
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`vote:${ip}`, 5, 60 * 60 * 1000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.floor(rateLimit.resetAt / 1000)),
        },
      }
    );
  }

  try {
    const body = await req.json();
    const parsed = voteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Verify request exists
    const [request] = await db
      .select()
      .from(requests)
      .where(eq(requests.id, params.id))
      .limit(1);

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Verify board is accessible
    const [board] = await db
      .select()
      .from(boards)
      .where(eq(boards.id, request.boardId))
      .limit(1);

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Check if already voted (verified vote)
    const [existingVote] = await db
      .select({ id: votes.id, verifiedAt: votes.verifiedAt })
      .from(votes)
      .where(and(eq(votes.requestId, params.id), eq(votes.voterEmail, email)))
      .limit(1);

    if (existingVote?.verifiedAt) {
      return NextResponse.json(
        { error: "You have already voted for this request" },
        { status: 409 }
      );
    }

    // Generate verification token (expires in 24h)
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Delete any existing unverified tokens for this email+request
    await db
      .delete(voteTokens)
      .where(and(eq(voteTokens.requestId, params.id), eq(voteTokens.email, email)));

    // Insert new token
    await db.insert(voteTokens).values({
      requestId: params.id,
      email,
      token,
      expiresAt,
    });

    // Send verification email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://feedbackkit.threestack.io";
    const verifyUrl = `${appUrl}/api/requests/${params.id}/vote/verify?token=${token}`;

    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: `FeedbackKit <noreply@${process.env.RESEND_FROM_DOMAIN ?? "feedbackkit.threestack.io"}>`,
          to: email,
          subject: `Confirm your vote: "${request.title}"`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #7c3aed;">Confirm your vote</h2>
              <p>You're voting for: <strong>${request.title}</strong></p>
              <p>Click the button below to confirm your vote. The link expires in 24 hours.</p>
              <a href="${verifyUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
                Confirm Vote
              </a>
              <p style="color: #666; font-size: 12px;">If you didn't vote, you can ignore this email.</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("[vote] Email send failed:", emailErr);
        // Don't fail the request — token is saved, email can be resent
      }
    } else {
      // Dev mode: log the verify URL
      console.info(`[vote] DEV: Verify URL: ${verifyUrl}`);
    }

    return NextResponse.json({
      message: "Verification email sent. Please check your inbox.",
      // In dev mode, expose the token for testing
      ...(process.env.NODE_ENV === "development" ? { devToken: token } : {}),
    });
  } catch (error) {
    console.error("[POST /api/requests/:id/vote]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
