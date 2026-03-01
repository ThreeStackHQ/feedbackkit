/**
 * Sprint 3.1 — Billing Portal
 *
 * GET /api/billing/portal
 *
 * Creates a Stripe Billing Portal session for the authenticated user.
 * Returns { url } for client-side redirect.
 *
 * Requires:
 *   - Authenticated session
 *   - User has stripeCustomerId (i.e., has been a paid customer at some point)
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY    — FeedbackKit Stripe secret key
 *   NEXT_PUBLIC_APP_URL  — App base URL (for return_url)
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { db, users, eq } from "@feedbackkit/db";

function getStripe(): Stripe {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Load user to get stripeCustomerId
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account found — upgrade first" },
      { status: 404 }
    );
  }

  const appUrl =
    process.env["NEXT_PUBLIC_APP_URL"] ?? "https://app.feedbackkit.threestack.io";

  try {
    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/settings/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[billing-portal] Stripe error: ${errMsg}`);
    return NextResponse.json(
      { error: "Failed to create billing portal session", details: errMsg },
      { status: 500 }
    );
  }
}
