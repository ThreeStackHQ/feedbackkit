/**
 * Integration tests: Billing Flows
 * Sprint 4.3 — FeedbackKit
 *
 * Covers:
 *  - POST /api/stripe/checkout   (create Stripe Checkout Session)
 *  - GET  /api/billing/status    (plan + usage summary)
 *  - Auth guards
 *  - Plan validation (indie/pro/team accepted, invalid rejected)
 *  - Stripe not configured error handling
 *  - Portal redirect when already on plan
 *  - Usage counters (boardsUsed, requestsCount)
 *
 * Mocks:
 *  - @feedbackkit/db
 *  - @/auth
 *  - stripe (Stripe constructor)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mock Stripe ──────────────────────────────────────────────────────────────

const mockCheckoutCreate = vi.fn();
const mockPortalCreate = vi.fn();

vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: mockCheckoutCreate,
        },
      },
      billingPortal: {
        sessions: {
          create: mockPortalCreate,
        },
      },
    })),
  };
});

// ─── Mock @feedbackkit/db ─────────────────────────────────────────────────────

const mockDbSelect = vi.fn();

vi.mock("@feedbackkit/db", () => ({
  db: { select: mockDbSelect },
  users: { id: "users.id" },
  subscriptions: { userId: "subscriptions.userId", createdAt: "subscriptions.createdAt" },
  boards: { id: "boards.id", userId: "boards.userId" },
  requests: { id: "requests.id", boardId: "requests.boardId" },
  eq: vi.fn((a, b) => ({ eq: [a, b] })),
  and: vi.fn((...args) => ({ and: args })),
  count: vi.fn(() => ({ type: "count" })),
  desc: vi.fn((col) => col),
  orderBy: vi.fn(),
}));

// ─── Mock @/auth ──────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({ auth: mockAuth }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSelectChain(rows: unknown[]) {
  const c = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
    // For queries awaited without .limit()
    then: (r: (v: unknown[]) => void) => Promise.resolve(rows).then(r),
  };
  mockDbSelect.mockReturnValueOnce(c);
  return c;
}

function postCheckout(body: unknown) {
  return new NextRequest("http://localhost:3000/api/stripe/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ─── POST /api/stripe/checkout ────────────────────────────────────────────────

describe("POST /api/stripe/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set required env vars
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";
    process.env.STRIPE_PRICE_INDIE = "price_indie_mock";
    process.env.STRIPE_PRICE_PRO = "price_pro_mock";
    process.env.STRIPE_PRICE_TEAM = "price_team_mock";
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/stripe/checkout/route");
    const req = postCheckout({ plan: "indie" });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 400 when plan is invalid", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });

    const { POST } = await import("@/app/api/stripe/checkout/route");
    const req = postCheckout({ plan: "enterprise" }); // not a valid plan
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("indie");
  });

  it("returns 400 when body is invalid JSON", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });

    const { POST } = await import("@/app/api/stripe/checkout/route");
    const req = new NextRequest("http://localhost:3000/api/stripe/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid JSON body");
  });

  it("creates a Stripe checkout session for an authenticated user", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", email: "dev@example.com" } });

    // User lookup — on free plan, no stripeCustomerId
    makeSelectChain([{
      id: "user-1",
      email: "dev@example.com",
      plan: "free",
      stripeCustomerId: null,
    }]);

    // Mock Stripe returning a checkout session
    mockCheckoutCreate.mockResolvedValueOnce({
      id: "cs_test_mock",
      url: "https://checkout.stripe.com/pay/cs_test_mock",
    });

    const { POST } = await import("@/app/api/stripe/checkout/route");
    const req = postCheckout({ plan: "indie" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toContain("stripe.com");
    expect(json.type).toBe("checkout");

    // Stripe called with correct params
    expect(mockCheckoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        client_reference_id: "user-1",
        metadata: expect.objectContaining({ plan: "indie" }),
        customer_email: "dev@example.com",
      })
    );
  });

  it("redirects to billing portal when user is already on the plan", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });

    // User already on indie plan with a Stripe customer ID
    makeSelectChain([{
      id: "user-1",
      email: "user@example.com",
      plan: "indie",
      stripeCustomerId: "cus_existing",
    }]);

    // Portal session mock
    mockPortalCreate.mockResolvedValueOnce({
      url: "https://billing.stripe.com/portal/session_mock",
    });

    const { POST } = await import("@/app/api/stripe/checkout/route");
    const req = postCheckout({ plan: "indie" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.type).toBe("portal");
    expect(json.url).toContain("billing.stripe.com");
  });

  it("returns 500 when Stripe price env is not configured", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });

    // User on free plan
    makeSelectChain([{
      id: "user-1",
      email: "user@example.com",
      plan: "free",
      stripeCustomerId: null,
    }]);

    // Remove the pro price env var
    delete process.env.STRIPE_PRICE_PRO;

    const { POST } = await import("@/app/api/stripe/checkout/route");
    const req = postCheckout({ plan: "pro" });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain("STRIPE_PRICE_PRO");
  });

  it("returns 500 when Stripe throws during checkout session creation", async () => {
    process.env.STRIPE_PRICE_INDIE = "price_indie_mock"; // restore
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });

    makeSelectChain([{
      id: "user-1",
      email: "user@example.com",
      plan: "free",
      stripeCustomerId: null,
    }]);

    mockCheckoutCreate.mockRejectedValueOnce(new Error("Stripe API error"));

    const { POST } = await import("@/app/api/stripe/checkout/route");
    const req = postCheckout({ plan: "indie" });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to create checkout session");
  });
});

// ─── GET /api/billing/status ──────────────────────────────────────────────────

describe("GET /api/billing/status", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/billing/status/route");
    const res = await GET();

    expect(res.status).toBe(401);
  });

  it("returns billing status with plan and usage counts", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });

    // User lookup
    makeSelectChain([{ id: "user-1", plan: "indie" }]);

    // Subscription lookup — no active sub
    makeSelectChain([]);

    // Board count
    const boardCountChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ n: 3 }]),
    };
    mockDbSelect.mockReturnValueOnce(boardCountChain);

    // Request count
    const reqCountChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockResolvedValue([{ n: 22 }]),
    };
    mockDbSelect.mockReturnValueOnce(reqCountChain);

    const { GET } = await import("@/app/api/billing/status/route");
    const res = await GET();

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.plan).toBe("indie");
    expect(json.boardsUsed).toBe(3);
    expect(json.requestsCount).toBe(22);
    expect(json.votesCount).toBe(0); // TODO field in the route
  });

  it("returns 404 when user record does not exist", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "ghost-user" } });

    makeSelectChain([]); // user not found

    const { GET } = await import("@/app/api/billing/status/route");
    const res = await GET();

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("User not found");
  });

  it("returns currentPeriodEnd when active subscription exists", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });

    makeSelectChain([{ id: "user-1", plan: "pro" }]);

    const periodEnd = new Date("2026-04-01T00:00:00Z");
    makeSelectChain([{
      stripeSubscriptionId: "sub_mock",
      status: "active",
      currentPeriodEnd: periodEnd,
    }]);

    // Board and request counts
    const bc = { from: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([{ n: 0 }]) };
    mockDbSelect.mockReturnValueOnce(bc);
    const rc = { from: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), innerJoin: vi.fn().mockResolvedValue([{ n: 0 }]) };
    mockDbSelect.mockReturnValueOnce(rc);

    const { GET } = await import("@/app/api/billing/status/route");
    const res = await GET();

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.plan).toBe("pro");
    expect(json.status).toBe("active");
    expect(json.currentPeriodEnd).toBe("2026-04-01T00:00:00.000Z");
  });
});

// ─── Plan Limit Enforcement (logic tests) ─────────────────────────────────────

describe("Plan limit enforcement logic", () => {
  /**
   * These tests validate the plan limit constants and logic in isolation.
   * They document the expected behavior of the guard that SHOULD be in the
   * POST /api/boards route (see board-flows test for the gap).
   */

  const PLAN_BOARD_LIMITS: Record<string, number> = {
    free: 1,
    indie: 5,
    pro: Infinity,
    team: Infinity,
  };

  it("free plan: allows exactly 1 board", () => {
    expect(0 < PLAN_BOARD_LIMITS.free).toBe(true);  // 0 boards → can create
    expect(1 < PLAN_BOARD_LIMITS.free).toBe(false); // 1 board → blocked
  });

  it("indie plan: allows up to 5 boards", () => {
    for (let i = 0; i < 5; i++) {
      expect(i < PLAN_BOARD_LIMITS.indie).toBe(true);
    }
    expect(5 < PLAN_BOARD_LIMITS.indie).toBe(false);
  });

  it("pro plan: no board limit", () => {
    expect(1000 < PLAN_BOARD_LIMITS.pro).toBe(true);
  });

  it("team plan: no board limit", () => {
    expect(999 < PLAN_BOARD_LIMITS.team).toBe(true);
  });

  it("upgrade from free → indie unlocks more boards", () => {
    const freeBoardCount = 1;
    expect(freeBoardCount < PLAN_BOARD_LIMITS.free).toBe(false); // blocked on free
    expect(freeBoardCount < PLAN_BOARD_LIMITS.indie).toBe(true); // allowed after upgrade
  });
});
