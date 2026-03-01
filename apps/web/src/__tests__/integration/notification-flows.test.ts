/**
 * Integration tests: Notification Flows
 * Sprint 4.3 — FeedbackKit
 *
 * Covers:
 *  - notifyWatchersOnStatusChange() — the core notification function
 *  - Deduplication (5-min TTL — same requestId+status skipped)
 *  - No-op when status didn't change
 *  - No-op when no watchers exist
 *  - Email sending (Resend) for each watcher
 *  - Vote verification flow (GET /api/requests/[id]/vote/verify)
 *  - POST /api/requests/[id]/vote  — rate limit, duplicate vote detection
 *
 * Mocks:
 *  - @feedbackkit/db
 *  - resend
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mock Resend ──────────────────────────────────────────────────────────────

const mockResendSend = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockResendSend },
  })),
}));

// ─── Mock @feedbackkit/db ─────────────────────────────────────────────────────

const mockDbSelect = vi.fn();
const mockDbInsert = vi.fn();
const mockDbUpdate = vi.fn();
const mockDbDelete = vi.fn();
const mockDbTransaction = vi.fn();

vi.mock("@feedbackkit/db", () => ({
  db: {
    select: mockDbSelect,
    insert: mockDbInsert,
    update: mockDbUpdate,
    delete: mockDbDelete,
    transaction: mockDbTransaction,
  },
  requests: { id: "requests.id", boardId: "requests.boardId", voteCount: "requests.voteCount" },
  boards: { id: "boards.id", slug: "boards.slug", name: "boards.name" },
  watchers: { requestId: "watchers.requestId", email: "watchers.email" },
  votes: { id: "votes.id", requestId: "votes.requestId", voterEmail: "votes.voterEmail", verifiedAt: "votes.verifiedAt" },
  voteTokens: {
    id: "voteTokens.id",
    requestId: "voteTokens.requestId",
    email: "voteTokens.email",
    token: "voteTokens.token",
    usedAt: "voteTokens.usedAt",
    expiresAt: "voteTokens.expiresAt",
  },
  eq: vi.fn((a, b) => ({ eq: [a, b] })),
  and: vi.fn((...args) => ({ and: args })),
  isNull: vi.fn((col) => ({ isNull: col })),
  sql: vi.fn((s) => s),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSelectChain(rows: unknown[]) {
  const c = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
    // for queries without .limit() that are awaited directly
    then: (r: (v: unknown[]) => void) => Promise.resolve(rows).then(r),
  };
  mockDbSelect.mockReturnValueOnce(c);
  return c;
}

function makeInsertChain(rows?: unknown[]) {
  const c = {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(rows ?? []),
    // for inserts without .returning()
    then: (r: (v: unknown) => void) => Promise.resolve(undefined).then(r),
  };
  mockDbInsert.mockReturnValueOnce(c);
  return c;
}

function makeUpdateChain(rows?: unknown[]) {
  const c = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(rows ?? []),
  };
  mockDbUpdate.mockReturnValueOnce(c);
  return c;
}

function makeDeleteChain() {
  const c = { where: vi.fn().mockResolvedValue(undefined) };
  mockDbDelete.mockReturnValueOnce(c);
  return c;
}

// ─── notifyWatchersOnStatusChange ─────────────────────────────────────────────

describe("notifyWatchersOnStatusChange", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "re_test_mock";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  });

  it("returns { sent:0, skipped:0, errors:0 } when status did not change", async () => {
    const { notifyWatchersOnStatusChange } = await import("@/lib/notifications");

    const result = await notifyWatchersOnStatusChange({
      requestId: "req-1",
      newStatus: "planned",
      previousStatus: "planned", // same status
    });

    expect(result).toEqual({ sent: 0, skipped: 0, errors: 0 });
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("sends emails to all watchers when status changes", async () => {
    // Re-import to get a clean dedup cache state (module is cached, but dedup key is unique)
    const { notifyWatchersOnStatusChange } = await import("@/lib/notifications");

    // Request lookup
    makeSelectChain([{ id: "req-unique-1", title: "Dark Mode Support", boardId: "board-1" }]);
    // Board lookup
    makeSelectChain([{ name: "Feature Requests", slug: "feature-requests" }]);
    // Watchers list
    makeSelectChain([
      { email: "alice@example.com" },
      { email: "bob@example.com" },
    ]);

    mockResendSend
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null });

    const result = await notifyWatchersOnStatusChange({
      requestId: "req-unique-1",
      newStatus: "shipped",
      previousStatus: "in_progress",
    });

    expect(result.sent).toBe(2);
    expect(result.errors).toBe(0);
    expect(mockResendSend).toHaveBeenCalledTimes(2);

    // Both emails should be targeted at the correct recipients
    const calls = mockResendSend.mock.calls;
    const toAddresses = calls.map((c) => c[0].to);
    expect(toAddresses).toContain("alice@example.com");
    expect(toAddresses).toContain("bob@example.com");
  });

  it("returns { sent:0 } when there are no watchers", async () => {
    const { notifyWatchersOnStatusChange } = await import("@/lib/notifications");

    makeSelectChain([{ id: "req-no-watchers", title: "Lonely Request", boardId: "board-1" }]);
    makeSelectChain([{ name: "My Board", slug: "my-board" }]);
    makeSelectChain([]); // no watchers

    const result = await notifyWatchersOnStatusChange({
      requestId: "req-no-watchers",
      newStatus: "wont_do",
      previousStatus: "under_review",
    });

    expect(result.sent).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.errors).toBe(0);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("counts errors when Resend returns an error for some recipients", async () => {
    const { notifyWatchersOnStatusChange } = await import("@/lib/notifications");

    makeSelectChain([{ id: "req-err-1", title: "Buggy notif", boardId: "board-x" }]);
    makeSelectChain([{ name: "Board X", slug: "board-x" }]);
    makeSelectChain([
      { email: "ok@example.com" },
      { email: "fail@example.com" },
    ]);

    mockResendSend
      .mockResolvedValueOnce({ error: null })              // ok@example.com — success
      .mockResolvedValueOnce({ error: { message: "Bad recipient" } }); // fail — error

    const result = await notifyWatchersOnStatusChange({
      requestId: "req-err-1",
      newStatus: "in_progress",
      previousStatus: "planned",
    });

    expect(result.sent).toBe(1);
    expect(result.errors).toBe(1);
  });

  it("skips notification when dedup cache is fresh (same requestId+status within 5 min)", async () => {
    const { notifyWatchersOnStatusChange } = await import("@/lib/notifications");

    // First call — should send
    makeSelectChain([{ id: "req-dedup", title: "Dedup Test", boardId: "board-1" }]);
    makeSelectChain([{ name: "Board", slug: "board" }]);
    makeSelectChain([{ email: "watcher@example.com" }]);
    mockResendSend.mockResolvedValueOnce({ error: null });

    const first = await notifyWatchersOnStatusChange({
      requestId: "req-dedup",
      newStatus: "planned",
      previousStatus: "under_review",
    });
    expect(first.sent).toBe(1);

    // Second call — same requestId + same newStatus — should be deduped
    vi.clearAllMocks(); // clear Resend mock counts, but dedup cache persists in module

    const second = await notifyWatchersOnStatusChange({
      requestId: "req-dedup",
      newStatus: "planned",
      previousStatus: "under_review",
    });

    // Should be skipped due to dedup
    expect(second.skipped).toBe(1);
    expect(mockResendSend).not.toHaveBeenCalled();
  });
});

// ─── POST /api/requests/[id]/vote ─────────────────────────────────────────────

describe("POST /api/requests/[id]/vote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear env to disable real Resend
    delete process.env.RESEND_API_KEY;
    process.env.NODE_ENV = "development"; // enables devToken in response
  });

  it("returns 400 for invalid (non-email) input", async () => {
    const { POST } = await import("@/app/api/requests/[id]/vote/route");
    const req = new NextRequest("http://localhost:3000/api/requests/req-1/vote", {
      method: "POST",
      headers: { "content-type": "application/json", "x-real-ip": "1.2.3.4" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    const res = await POST(req, { params: { id: "req-1" } });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("returns 404 when request does not exist", async () => {
    makeSelectChain([]); // request not found

    const { POST } = await import("@/app/api/requests/[id]/vote/route");
    const req = new NextRequest("http://localhost:3000/api/requests/bad-req/vote", {
      method: "POST",
      headers: { "content-type": "application/json", "x-real-ip": "1.2.3.5" },
      body: JSON.stringify({ email: "voter@example.com" }),
    });
    const res = await POST(req, { params: { id: "bad-req" } });

    expect(res.status).toBe(404);
  });

  it("returns 409 when the email has already voted (verified)", async () => {
    // Request exists
    makeSelectChain([{ id: "req-1", title: "Dark Mode", boardId: "board-1" }]);
    // Board exists
    makeSelectChain([{ id: "board-1", isPublic: true }]);
    // Existing verified vote
    makeSelectChain([{ id: "vote-1", verifiedAt: new Date() }]);

    const { POST } = await import("@/app/api/requests/[id]/vote/route");
    const req = new NextRequest("http://localhost:3000/api/requests/req-1/vote", {
      method: "POST",
      headers: { "content-type": "application/json", "x-real-ip": "1.2.3.6" },
      body: JSON.stringify({ email: "already@voted.com" }),
    });
    const res = await POST(req, { params: { id: "req-1" } });

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain("already voted");
  });

  it("creates a vote token and returns success message (dev mode exposes token)", async () => {
    // Request exists
    makeSelectChain([{ id: "req-2", title: "Feature X", boardId: "board-1" }]);
    // Board exists
    makeSelectChain([{ id: "board-1", isPublic: true }]);
    // No existing vote
    makeSelectChain([]);
    // Delete old tokens (no-op)
    makeDeleteChain();
    // Insert new token
    makeInsertChain();

    const { POST } = await import("@/app/api/requests/[id]/vote/route");
    const req = new NextRequest("http://localhost:3000/api/requests/req-2/vote", {
      method: "POST",
      headers: { "content-type": "application/json", "x-real-ip": "10.0.0.1" },
      body: JSON.stringify({ email: "newvoter@example.com" }),
    });
    const res = await POST(req, { params: { id: "req-2" } });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toContain("Verification email sent");
    // Dev mode: token returned for testing convenience
    expect(json.devToken).toBeDefined();
    expect(typeof json.devToken).toBe("string");
    expect(json.devToken).toHaveLength(64); // 32 bytes hex
  });

  it("returns 429 when rate limit is exceeded", async () => {
    /**
     * Rate limit: 5 votes per IP per hour.
     * The rate-limit module is in-memory and tracks by key.
     * Since tests run in the same process, we hit the limit by calling 6 times
     * from the same IP. The first 5 will either succeed or 404; the 6th should 429.
     *
     * Note: This test is sensitive to module cache state across tests.
     * In a full test run, this IP hasn't been used before, so we can simulate.
     */

    // We call the vote endpoint 6 times from the same IP
    // After 5 allowed requests, the 6th should be rate-limited
    const IP = "9.9.9.9";
    let last429 = false;

    for (let i = 0; i < 6; i++) {
      // For each call, set up minimal mocks (request not found is fine for this test)
      makeSelectChain([]); // request not found — that's ok, we just need to check rate limit behavior

      const { POST } = await import("@/app/api/requests/[id]/vote/route");
      const req = new NextRequest(`http://localhost:3000/api/requests/req-rate/vote`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-real-ip": IP },
        body: JSON.stringify({ email: `voter${i}@example.com` }),
      });
      const res = await POST(req, { params: { id: "req-rate" } });
      if (res.status === 429) {
        last429 = true;
        break;
      }
    }

    expect(last429).toBe(true);
  });
});

// ─── GET /api/requests/[id]/vote/verify ───────────────────────────────────────

describe("GET /api/requests/[id]/vote/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  });

  it("redirects to /vote/invalid when token is missing", async () => {
    const { GET } = await import("@/app/api/requests/[id]/vote/verify/route");
    const req = new NextRequest("http://localhost:3000/api/requests/req-1/vote/verify");
    const res = await GET(req, { params: { id: "req-1" } });

    expect(res.status).toBe(307); // NextResponse.redirect
    const location = res.headers.get("location");
    expect(location).toContain("reason=missing_token");
  });

  it("redirects to /vote/invalid when token is not found in DB", async () => {
    makeSelectChain([]); // token not found

    const { GET } = await import("@/app/api/requests/[id]/vote/verify/route");
    const req = new NextRequest("http://localhost:3000/api/requests/req-1/vote/verify?token=badtoken");
    const res = await GET(req, { params: { id: "req-1" } });

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("reason=invalid_token");
  });

  it("redirects to /vote/invalid when token is expired", async () => {
    const expiredToken = {
      id: "token-1",
      requestId: "req-1",
      email: "voter@example.com",
      token: "validtoken",
      expiresAt: new Date(Date.now() - 1000), // expired 1 second ago
      usedAt: null,
    };
    makeSelectChain([expiredToken]);

    const { GET } = await import("@/app/api/requests/[id]/vote/verify/route");
    const req = new NextRequest("http://localhost:3000/api/requests/req-1/vote/verify?token=validtoken");
    const res = await GET(req, { params: { id: "req-1" } });

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("reason=expired_token");
  });

  it("completes the vote atomically and redirects to /vote/success", async () => {
    const validToken = {
      id: "token-2",
      requestId: "req-verify-1",
      email: "voter@example.com",
      token: "goodtoken",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // valid for 24h
      usedAt: null,
    };

    // Token lookup
    makeSelectChain([validToken]);

    // Request exists
    makeSelectChain([{ id: "req-verify-1", title: "Feature X", voteCount: 3 }]);

    // No existing vote
    makeSelectChain([]);

    // Transaction
    mockDbTransaction.mockImplementationOnce(async (cb: (tx: unknown) => Promise<void>) => {
      const tx = {
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) }),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
      };
      await cb(tx);
    });

    const { GET } = await import("@/app/api/requests/[id]/vote/verify/route");
    const req = new NextRequest("http://localhost:3000/api/requests/req-verify-1/vote/verify?token=goodtoken");
    const res = await GET(req, { params: { id: "req-verify-1" } });

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/vote/success");
    expect(location).toContain("req-verify-1");
  });

  it("redirects to /vote/already-voted when vote already verified", async () => {
    const validToken = {
      id: "token-3",
      requestId: "req-dup",
      email: "voter@example.com",
      token: "duptoken",
      expiresAt: new Date(Date.now() + 3600 * 1000),
      usedAt: null,
    };
    makeSelectChain([validToken]);

    // Request exists
    makeSelectChain([{ id: "req-dup", title: "Dup Vote Test", voteCount: 1 }]);

    // Existing verified vote
    makeSelectChain([{ id: "existing-vote", verifiedAt: new Date() }]);

    const { GET } = await import("@/app/api/requests/[id]/vote/verify/route");
    const req = new NextRequest("http://localhost:3000/api/requests/req-dup/vote/verify?token=duptoken");
    const res = await GET(req, { params: { id: "req-dup" } });

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("already-voted");
  });
});
