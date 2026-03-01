/**
 * Sprint 3.1 — Stripe Billing Integration
 *
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout Session for FeedbackKit subscription upgrade.
 * Returns { url } for client-side redirect.
 *
 * Plans:
 *   - indie  → Indie   $9/mo   (STRIPE_PRICE_INDIE)
 *   - pro    → Pro     $19/mo  (STRIPE_PRICE_PRO)
 *   - team   → Team    $49/mo  (STRIPE_PRICE_TEAM)
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY    — FeedbackKit platform secret key
 *   STRIPE_PRICE_INDIE   — Stripe Price ID for $9/mo
 *   STRIPE_PRICE_PRO     — Stripe Price ID for $19/mo
 *   STRIPE_PRICE_TEAM    — Stripe Price ID for $49/mo
 *   NEXT_PUBLIC_APP_URL  — App base URL
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { db, users, subscriptions, eq } from "@feedbackkit/db";
import { z } from "zod";

function getStripe(): Stripe {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

const PLAN_PRICE_ENV: Record<string, string> = {
  indie: "STRIPE_PRICE_INDIE",
  pro: "STRIPE_PRICE_PRO",
  team: "STRIPE_PRICE_TEAM",
};

const CheckoutBodySchema = z.object({
  plan: z.enum(["indie", "pro", "team"]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CheckoutBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid plan. Must be 'indie', 'pro', or 'team'" },
      { status: 400 }
    );
  }

  const { plan } = parsed.data;
  const priceId = process.env[PLAN_PRICE_ENV[plan]!];

  if (!priceId) {
    return NextResponse.json(
      { error: `${PLAN_PRICE_ENV[plan]} not configured` },
      { status: 500 }
    );
  }

  const appUrl =
    process.env["NEXT_PUBLIC_APP_URL"] ?? "https://app.feedbackkit.threestack.io";

  // Load user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // If already on this plan and active, return portal
  const stripeCustomerId = user.stripeCustomerId ?? undefined;
  if (user.plan === plan && stripeCustomerId) {
    try {
      const stripe = getStripe();
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${appUrl}/settings/billing`,
      });
      return NextResponse.json({ url: portalSession.url, type: "portal" });
    } catch {
      // Fall through to checkout
    }
  }

  try {
    const stripe = getStripe();

    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings/billing?success=1&plan=${plan}`,
      cancel_url: `${appUrl}/settings/billing?canceled=1`,
      client_reference_id: session.user.id,
      metadata: { userId: session.user.id, plan },
      subscription_data: { metadata: { userId: session.user.id, plan } },
    };

    if (stripeCustomerId) {
      checkoutParams.customer = stripeCustomerId;
    } else {
      checkoutParams.customer_email = user.email;
    }

    const checkoutSession = await stripe.checkout.sessions.create(checkoutParams);

    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: checkoutSession.url, type: "checkout" });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[checkout] Stripe error: ${errMsg}`);
    return NextResponse.json(
      { error: "Failed to create checkout session", details: errMsg },
      { status: 500 }
    );
  }
}
