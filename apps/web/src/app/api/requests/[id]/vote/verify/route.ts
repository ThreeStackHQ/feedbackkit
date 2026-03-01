export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db, requests, votes, watchers, voteTokens, eq, and, isNull, sql } from "@feedbackkit/db";

// GET /api/requests/:id/vote/verify?token=X
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://feedbackkit.threestack.io";

  if (!token) {
    return NextResponse.redirect(`${appUrl}/vote/invalid?reason=missing_token`);
  }

  try {
    // Find token
    const [voteToken] = await db
      .select()
      .from(voteTokens)
      .where(
        and(
          eq(voteTokens.requestId, params.id),
          eq(voteTokens.token, token),
          isNull(voteTokens.usedAt)
        )
      )
      .limit(1);

    if (!voteToken) {
      return NextResponse.redirect(`${appUrl}/vote/invalid?reason=invalid_token`);
    }

    // Check expiry
    if (voteToken.expiresAt < new Date()) {
      return NextResponse.redirect(`${appUrl}/vote/invalid?reason=expired_token`);
    }

    // Verify request still exists
    const [request] = await db
      .select()
      .from(requests)
      .where(eq(requests.id, params.id))
      .limit(1);

    if (!request) {
      return NextResponse.redirect(`${appUrl}/vote/invalid?reason=request_not_found`);
    }

    // Check if already voted
    const [existingVote] = await db
      .select({ id: votes.id, verifiedAt: votes.verifiedAt })
      .from(votes)
      .where(
        and(
          eq(votes.requestId, params.id),
          eq(votes.voterEmail, voteToken.email)
        )
      )
      .limit(1);

    if (existingVote?.verifiedAt) {
      return NextResponse.redirect(`${appUrl}/vote/already-voted`);
    }

    // Execute vote atomically:
    // 1. Mark token as used
    // 2. Upsert vote (add or verify)
    // 3. Increment voteCount on request
    // 4. Add to watchers

    await db.transaction(async (tx) => {
      // Mark token used
      await tx
        .update(voteTokens)
        .set({ usedAt: new Date() })
        .where(eq(voteTokens.id, voteToken.id));

      // Upsert vote — insert or update verifiedAt
      if (existingVote) {
        await tx
          .update(votes)
          .set({ verifiedAt: new Date() })
          .where(eq(votes.id, existingVote.id));
      } else {
        await tx.insert(votes).values({
          requestId: params.id,
          voterEmail: voteToken.email,
          verifiedAt: new Date(),
        });
      }

      // Increment voteCount atomically
      await tx
        .update(requests)
        .set({ voteCount: sql`${requests.voteCount} + 1`, updatedAt: new Date() })
        .where(eq(requests.id, params.id));

      // Add to watchers (ignore duplicate — unique constraint)
      try {
        await tx.insert(watchers).values({
          requestId: params.id,
          email: voteToken.email,
        });
      } catch {
        // Unique constraint violation — already watching, that's fine
      }
    });

    // Redirect to success page
    return NextResponse.redirect(`${appUrl}/vote/success?request=${params.id}`);
  } catch (error) {
    console.error("[GET /api/requests/:id/vote/verify]", error);
    return NextResponse.redirect(`${appUrl}/vote/invalid?reason=server_error`);
  }
}
