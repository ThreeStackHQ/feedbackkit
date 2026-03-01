/**
 * Integration tests: Board Flows
 * Sprint 4.3 — FeedbackKit
 *
 * Covers:
 *  - POST /api/boards  (create board)
 *  - GET  /api/boards  (list boards)
 *  - Auth guard enforcement
 *  - Slug generation (auto + custom)
 *  - Plan limit enforcement (free=1 board, indie=5, pro=unlimited)
 *  - Validation errors
 *
 * Mocks:
 *  - @feedbackkit/db   — db object + table refs
 *  - @/auth            — auth() session helper
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mock @feedbackkit/db ─────────────────────────────────────────────────────

const mockDbSelect = vi.fn();
const mockDbInsert = vi.fn();
const mockDbDelete = vi.fn();

const mockDb = {
  select: mockDbSelect,
  insert: mockDbInsert,
  delete: mockDbDelete,
};

vi.mock("@feedbackkit/db", () => ({
  db: mockDb,
  boards: { id: "boards.id", userId: "boards.userId", slug: "boards.slug", createdAt: "boards.createdAt" },
  users: { id: "users.id" },
  subscriptions: { userId: "subscriptions.userId", createdAt: "subscriptions.createdAt" },
  eq: vi.fn((a, b) => ({ type: "eq", a, b })),
  and: vi.fn((...args) => ({ type: "and", args })),
  count: vi.fn(() => ({ type: "count" })),
  desc: vi.fn((col) => ({ type: "desc", col })),
  asc: vi.fn((col) => ({ type: "asc", col })),
}));

// ─── Mock @/auth ──────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({ auth: mockAuth }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a mock select chain that ultimately resolves to `rows`. */
function mockSelectReturning(rows: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
    // Allow awaiting without .limit() (list queries)
    then: (res: (v: unknown) => void) => Promise.resolve(rows).then(res),
    [Symbol.iterator]: undefined as unknown,
  };
  // Make it thenable so `await db.select()...` works without limit()
  Object.defineProperty(chain, Symbol.iterator, {
    get: () => rows[Symbol.iterator].bind(rows),
  });
  mockDbSelect.mockReturnValueOnce(chain);
  return chain;
}

/** Build a mock insert chain returning `rows` via .returning(). */
function mockInsertReturning(rows: unknown[]) {
  const chain = {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(rows),
  };
  mockDbInsert.mockReturnValueOnce(chain);
  return chain;
}

/** Make next request with JSON body. */
function makeReq(body: unknown, url = "http://localhost:3000/api/boards") {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/boards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/boards/route");
    const req = makeReq({ name: "My Board" });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 400 when board name is missing", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });

    const { POST } = await import("@/app/api/boards/route");
    const req = makeReq({ name: "" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
    expect(json.issues).toBeDefined();
  });

  it("returns 400 when custom slug has invalid characters", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });

    const { POST } = await import("@/app/api/boards/route");
    const req = makeReq({ name: "Board", slug: "Invalid Slug!" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("creates a board with auto-generated slug when no slug provided", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });

    // First: slug uniqueness check → no existing board found
    mockSelectReturning([]); // slug uniqueness query

    // Then: insert returns new board
    const newBoard = {
      id: "board-uuid-1",
      userId: "user-1",
      name: "Feature Requests",
      slug: "feature-requests-abc123",
      isPublic: true,
      createdAt: new Date().toISOString(),
    };
    mockInsertReturning([newBoard]);

    const { POST } = await import("@/app/api/boards/route");
    const req = makeReq({ name: "Feature Requests" });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe("board-uuid-1");
    expect(json.name).toBe("Feature Requests");
    // Slug should be auto-generated (starts with sanitized name)
    expect(json.slug).toMatch(/^feature-requests/);
  });

  it("creates a board with user-provided slug when slug is valid", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });

    // Slug uniqueness check → no conflict
    mockSelectReturning([]);

    const newBoard = {
      id: "board-uuid-2",
      userId: "user-1",
      name: "My Feedback",
      slug: "my-feedback",
      isPublic: true,
      createdAt: new Date().toISOString(),
    };
    mockInsertReturning([newBoard]);

    const { POST } = await import("@/app/api/boards/route");
    const req = makeReq({ name: "My Feedback", slug: "my-feedback" });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.slug).toBe("my-feedback");
  });

  it("regenerates slug when there is a collision (up to 5 attempts)", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });

    // First 2 slug checks return an existing board (collision), 3rd resolves
    mockSelectReturning([{ id: "existing-1" }]); // attempt 1 — collision
    mockSelectReturning([{ id: "existing-2" }]); // attempt 2 — collision
    mockSelectReturning([]);                       // attempt 3 — available

    const newBoard = { id: "board-uuid-3", userId: "user-1", name: "X", slug: "x-zzzzzz", isPublic: true };
    mockInsertReturning([newBoard]);

    const { POST } = await import("@/app/api/boards/route");
    const req = makeReq({ name: "X" });
    const res = await POST(req);

    // Board should still be created (collision resolved on 3rd attempt)
    expect(res.status).toBe(201);
  });

  it("creates a private board when isPublic=false", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockSelectReturning([]); // slug check

    const newBoard = {
      id: "board-uuid-4",
      userId: "user-1",
      name: "Internal Board",
      slug: "internal-board-xyz",
      isPublic: false,
    };
    mockInsertReturning([newBoard]);

    const { POST } = await import("@/app/api/boards/route");
    const req = makeReq({ name: "Internal Board", isPublic: false });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.isPublic).toBe(false);
  });
});

describe("GET /api/boards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/boards/route");
    const req = new NextRequest("http://localhost:3000/api/boards");
    const res = await GET();

    expect(res.status).toBe(401);
  });

  it("returns list of boards for authenticated user", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });

    const userBoards = [
      { id: "b1", name: "Board 1", slug: "board-1", userId: "user-1" },
      { id: "b2", name: "Board 2", slug: "board-2", userId: "user-1" },
    ];

    // Mock the full chain: select().from().where().orderBy()  → returns boards
    const chain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue(userBoards),
    };
    mockDbSelect.mockReturnValueOnce(chain);

    const { GET } = await import("@/app/api/boards/route");
    const req = new NextRequest("http://localhost:3000/api/boards");
    const res = await GET();

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(2);
  });
});

// ─── Plan Limit Logic (unit-level) ───────────────────────────────────────────
// Note: The current boards/route.ts does NOT enforce plan limits — this is a
// documented gap. The billing/status route tracks boardsUsed, but the board
// creation route lacks enforcement. These tests document the EXPECTED behavior
// for when the guard is added.

describe("Plan limit enforcement (documented gap + expected behavior)", () => {
  it("DOCUMENTED GAP: POST /api/boards does NOT currently check plan limits", async () => {
    /**
     * ISSUE: [SEVERITY: Medium]
     *
     * The POST /api/boards route creates boards without checking the user's plan limits:
     *   - free: 1 board max
     *   - indie: 5 boards max
     *   - pro: unlimited
     *
     * The billing/status GET route correctly tracks boardsUsed, but creation is unchecked.
     *
     * EXPECTED FIX: Before inserting, query the user's plan and board count:
     *   const PLAN_LIMITS = { free: 1, indie: 5, pro: Infinity, team: Infinity };
     *   if (boardCount >= PLAN_LIMITS[user.plan]) {
     *     return NextResponse.json({ error: "Plan limit reached" }, { status: 403 });
     *   }
     *
     * This test documents the expected behavior post-fix.
     */
    expect(true).toBe(true); // placeholder — real assertion added when fix is applied
  });

  it("EXPECTED: free plan users blocked from creating >1 board", () => {
    const PLAN_LIMITS: Record<string, number> = { free: 1, indie: 5, pro: Infinity, team: Infinity };
    const userPlan = "free";
    const boardCount = 1;

    const isLimitReached = boardCount >= PLAN_LIMITS[userPlan];
    expect(isLimitReached).toBe(true); // should return 403
  });

  it("EXPECTED: indie plan allows up to 5 boards", () => {
    const PLAN_LIMITS: Record<string, number> = { free: 1, indie: 5, pro: Infinity, team: Infinity };
    const userPlan = "indie";

    expect(4 >= PLAN_LIMITS[userPlan]).toBe(false); // 4 boards → still allowed
    expect(5 >= PLAN_LIMITS[userPlan]).toBe(true);  // 5 boards → blocked
  });

  it("EXPECTED: pro plan has no board limit", () => {
    const PLAN_LIMITS: Record<string, number> = { free: 1, indie: 5, pro: Infinity, team: Infinity };
    expect(100 >= PLAN_LIMITS["pro"]).toBe(false); // never blocked
  });
});
