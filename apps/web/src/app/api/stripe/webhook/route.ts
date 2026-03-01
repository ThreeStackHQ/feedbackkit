/**
 * Sprint 3.1 — Stripe Webhook Handler
 *
 * POST /api/stripe/webhook
 *
 * Handles Stripe subscription lifecycle events for FeedbackKit billing.
 *
 * Events handled:
 *   - customer.subscription.created  → create subscription row, update user.plan
 *   - customer.subscription.updated  → update subscription row + user.plan
 *   - customer.subscription.deleted  → mark canceled, downgrade user to free
 *   - invoice.payment_failed         → mark subscription past_due
 *   - invoice.payment_succeeded      → re-activate subscription
 *   - checkout.session.completed     → set stripeCustomerId on user
 *
 * Security: raw body verified with Stripe-Signature (HMAC-SHA256).
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY      — FeedbackKit Stripe secret key
 *   STRIPE_WEBHOOK_SECRET  — Signing secret for webhook endpoint
 *   STRIPE_PRICE_INDIE     — Price ID for indie plan
 *   STRIPE_PRICE_PRO       — Price ID for pro plan
 *   STRIPE_PRICE_TEAM      — Price ID for team plan
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db, users, subscriptions, eq } from "@feedbackkit/db";
import Stripe from "stripe";

// ─── Stripe Client ─────────────────────────────────────────────────────────────

function getStripe(): Stripe {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

// ─── Plan from Price ID ───────────────────────────────────────────────────────

type Plan = "free" | "indie" | "pro" | "team";

function planFromPriceId(priceId: string): Plan {
  const indie = (process.env["STRIPE_PRICE_INDIE"] ?? "").split(",");
  const pro = (process.env["STRIPE_PRICE_PRO"] ?? "").split(",");
  const team = (process.env["STRIPE_PRICE_TEAM"] ?? "").split(",");
  if (team.includes(priceId)) return "team";
  if (pro.includes(priceId)) return "pro";
  if (indie.includes(priceId)) return "indie";
  return "free";
}

// ─── Stripe Signature Verification ────────────────────────────────────────────

async function verifyWebhookSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<Stripe.Event> {
  const stripe = getStripe();
  // Use Stripe SDK's built-in verification
  return stripe.webhooks.constructEventAsync(payload, sigHeader, secret);
}

// ─── Subscription Status Map ──────────────────────────────────────────────────

function mapSubStatus(
  status: string
): "active" | "canceled" | "past_due" | "trialing" {
  if (status === "active") return "active";
  if (status === "canceled") return "canceled";
  if (status === "past_due" || status === "unpaid") return "past_due";
  if (status === "trialing") return "trialing";
  return "active";
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleSubscriptionUpsert(sub: Stripe.Subscription) {
  const priceId = sub.items.data[0]?.price?.id ?? "";
  const plan = planFromPriceId(priceId);
  const status = mapSubStatus(sub.status);
  // In Stripe v20, current_period_end moved to SubscriptionItem level
  const periodEndTs = sub.items.data[0]?.current_period_end ?? null;
  const currentPeriodEnd = periodEndTs
    ? new Date(periodEndTs * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // fallback: +30d

  // Update user.plan + user.stripeCustomerId
  await db
    .update(users)
    .set({
      plan,
      stripeCustomerId: sub.customer as string,
      updatedAt: new Date(),
    })
    .where(eq(users.stripeCustomerId, sub.customer as string));

  // Upsert subscriptions row
  const existingSub = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, sub.id))
    .limit(1);

  if (existingSub.length > 0) {
    await db
      .update(subscriptions)
      .set({
        plan,
        status,
        stripePriceId: priceId,
        currentPeriodEnd,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, sub.id));
  } else {
    // Find user by stripe customer ID
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.stripeCustomerId, sub.customer as string))
      .limit(1);

    if (user) {
      await db.insert(subscriptions).values({
        userId: user.id,
        stripeSubscriptionId: sub.id,
        stripePriceId: priceId,
        plan,
        status,
        currentPeriodEnd,
      });
    }
  }

  console.log(`[webhook] ✅ Subscription ${sub.id} → plan=${plan} status=${status}`);
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  // Downgrade user to free
  await db
    .update(users)
    .set({ plan: "free", updatedAt: new Date() })
    .where(eq(users.stripeCustomerId, sub.customer as string));

  // Mark subscription canceled
  await db
    .update(subscriptions)
    .set({ status: "canceled", updatedAt: new Date() })
    .where(eq(subscriptions.stripeSubscriptionId, sub.id));

  console.log(`[webhook] ✅ Subscription ${sub.id} deleted → downgraded to free`);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Set stripeCustomerId on user using client_reference_id (userId)
  if (session.client_reference_id && session.customer) {
    await db
      .update(users)
      .set({
        stripeCustomerId: session.customer as string,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.client_reference_id));

    console.log(
      `[webhook] ✅ Checkout complete — userId=${session.client_reference_id} customerId=${session.customer}`
    );
  }
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text();
  const sigHeader = request.headers.get("stripe-signature");
  const secret = process.env["STRIPE_WEBHOOK_SECRET"];

  if (!sigHeader || !secret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await verifyWebhookSignature(rawBody, sigHeader, secret);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        // Stripe v20: subscription moved to parent.subscription_details.subscription
        const subId = inv.parent?.subscription_details?.subscription;
        if (subId) {
          await db
            .update(subscriptions)
            .set({ status: "past_due", updatedAt: new Date() })
            .where(
              eq(subscriptions.stripeSubscriptionId, subId as string)
            );
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const inv = event.data.object as Stripe.Invoice;
        const subId = inv.parent?.subscription_details?.subscription;
        if (subId) {
          await db
            .update(subscriptions)
            .set({ status: "active", updatedAt: new Date() })
            .where(
              eq(subscriptions.stripeSubscriptionId, subId as string)
            );
        }
        break;
      }

      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`[webhook] Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error("[webhook] Handler error:", err);
    return NextResponse.json({
      received: true,
      warning: "Handler error — check server logs",
    });
  }

  return NextResponse.json({ received: true });
}
