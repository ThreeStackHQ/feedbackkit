/**
 * Sprint 3.3 — Billing Status API
 *
 * GET /api/billing/status
 *
 * Returns current user's billing plan + usage stats.
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, subscriptions, boards, requests, eq, and } from "@feedbackkit/db";
import { count } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Load user + subscription
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Load most recent active subscription
  const [activeSub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(subscriptions.createdAt)
    .limit(1);

  // Count boards
  const boardCountResult = await db
    .select({ n: count() })
    .from(boards)
    .where(eq(boards.userId, userId));
  const boardCount = boardCountResult[0]?.n ?? 0;

  // Count requests across all user boards
  const requestCountResult = await db
    .select({ n: count(requests.id) })
    .from(requests)
    .innerJoin(boards, and(eq(requests.boardId, boards.id), eq(boards.userId, userId)));
  const requestCount = requestCountResult[0]?.n ?? 0;

  const voteCount = 0; // TODO: aggregate vote count

  const plan = user.plan ?? "free";
  const status = activeSub?.status ?? "active";
  const currentPeriodEnd = activeSub?.currentPeriodEnd?.toISOString() ?? null;

  return NextResponse.json({
    plan,
    status,
    currentPeriodEnd,
    boardsUsed: boardCount,
    requestsCount: requestCount,
    votesCount: voteCount,
  });
}
