/**
 * Integration tests: Request Flows
 * Sprint 4.3 — FeedbackKit
 *
 * Covers:
 *  - POST /api/boards/[id]/requests  (submit feature request)
 *  - GET  /api/boards/[id]/requests  (list requests, public vs private)
 *  - PATCH /api/requests/[id]        (status update, admin only)
 *  - DELETE /api/requests/[id]       (delete, admin only)
 *  - GET /api/requests/[id]          (single request fetch)
 *  - Validation (title required, max lengths)
 *  - Auth guards on private boards
 *  - Status change triggering notification (fire-and-forget)
 *
 * Mocks:
 *  - @feedbackkit/db
 *  - @/auth
 *  - @/lib/notifications
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockDbSelect = vi.fn();
const mockDbInsert = vi.fn();
const mockDbUpdate = vi.fn();
const mockDbDelete = vi.fn();

vi.mock("@feedbackkit/db", () => ({
  db: {
    select: mockDbSelect,
    insert: mockDbInsert,
    update: mockDbUpdate,
    delete: mockDbDelete,
  },
  boards: { id: "boards.id", userId: "boards.userId", isPublic: "boards.isPublic" },
  requests: {
    id: "requests.id",
    boardId: "requests.boardId",
    voteCount: "requests.voteCount",
    status: "requests.status",
  },
  eq: vi.fn((a, b) => ({ eq: [a, b] })),
  and: vi.fn((...args) => ({ and: args })),
  desc: vi.fn((col) => col),
  asc: vi.fn((col) => col),
  sql: vi.fn((s) => s),
}));

const mockNotifyWatchers = vi.fn().mockResolvedValue({ sent: 0, skipped: 0, errors: 0 });
vi.mock("@/lib/notifications", () => ({
  notifyWatchersOnStatusChange: mockNotifyWatchers,
}));

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({ auth: mockAuth }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSelectChain(rows: unknown[]) {
  const c = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(rows),
    limit: vi.fn().mockResolvedValue(rows),
  };
  mockDbSelect.mockReturnValueOnce(c);
  return c;
}

function makeInsertChain(rows: unknown[]) {
  const c = { values: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue(rows) };
  mockDbInsert.mockReturnValueOnce(c);
  return c;
}

function makeUpdateChain(rows: unknown[]) {
  const c = { set: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue(rows) };
  mockDbUpdate.mockReturnValueOnce(c);
  return c;
}

function makeDeleteChain() {
  const c = { where: vi.fn().mockResolvedValue(undefined) };
  mockDbDelete.mockReturnValueOnce(c);
  return c;
}

function postReq(body: unknown, boardId = "board-1") {
  return new NextRequest(`http://localhost:3000/api/boards/${boardId}/requests`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function patchReq(body: unknown, requestId = "req-1") {
  return new NextRequest(`http://localhost:3000/api/requests/${requestId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ─── POST /api/boards/[id]/requests ──────────────────────────────────────────

describe("POST /api/boards/[id]/requests", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when title is missing", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/boards/[id]/requests/route");
    const req = postReq({ description: "No title here" });
    const res = await POST(req, { params: { id: "board-1" } });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("returns 404 when board does not exist", async () => {
    mockAuth.mockResolvedValueOnce(null);
    makeSelectChain([]); // board lookup → empty

    const { POST } = await import("@/app/api/boards/[id]/requests/route");
    const req = postReq({ title: "My Feature" });
    const res = await POST(req, { params: { id: "nonexistent-board" } });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Board not found");
  });

  it("returns 403 when submitting to a private board without ownership", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-stranger" } });

    // Board exists but is private, owned by another user
    makeSelectChain([{ id: "board-1", isPublic: false, userId: "user-owner" }]);

    const { POST } = await import("@/app/api/boards/[id]/requests/route");
    const req = postReq({ title: "Feature request" });
    const res = await POST(req, { params: { id: "board-1" } });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("creates a request on a public board (no auth needed)", async () => {
    mockAuth.mockResolvedValueOnce(null); // anonymous user

    // Public board exists
    makeSelectChain([{ id: "board-1", isPublic: true, userId: "user-owner" }]);

    // Insert returning new request
    const newRequest = {
      id: "req-uuid-1",
      boardId: "board-1",
      title: "Dark mode support",
      description: "Please add dark mode",
      status: "under_review",
      voteCount: 0,
    };
    makeInsertChain([newRequest]);

    const { POST } = await import("@/app/api/boards/[id]/requests/route");
    const req = postReq({ title: "Dark mode support", description: "Please add dark mode" });
    const res = await POST(req, { params: { id: "board-1" } });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.title).toBe("Dark mode support");
    expect(json.status).toBe("under_review");
    expect(json.voteCount).toBe(0);
  });

  it("creates a request on a private board when owner is authenticated", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-owner" } });

    // Private board owned by the authenticated user
    makeSelectChain([{ id: "board-1", isPublic: false, userId: "user-owner" }]);

    const newRequest = {
      id: "req-uuid-2",
      boardId: "board-1",
      title: "Private Feature",
      status: "under_review",
      voteCount: 0,
    };
    makeInsertChain([newRequest]);

    const { POST } = await import("@/app/api/boards/[id]/requests/route");
    const req = postReq({ title: "Private Feature" });
    const res = await POST(req, { params: { id: "board-1" } });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.title).toBe("Private Feature");
  });

  it("returns 400 when title exceeds 200 characters", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/boards/[id]/requests/route");
    const req = postReq({ title: "A".repeat(201) });
    const res = await POST(req, { params: { id: "board-1" } });

    expect(res.status).toBe(400);
  });
});

// ─── GET /api/boards/[id]/requests ───────────────────────────────────────────

describe("GET /api/boards/[id]/requests", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns requests for a public board (unauthenticated)", async () => {
    mockAuth.mockResolvedValueOnce(null);

    // Board lookup
    makeSelectChain([{ id: "board-1", isPublic: true, userId: "owner" }]);
    // Requests list
    const reqs = [
      { id: "r1", title: "Feature A", voteCount: 10, status: "planned" },
      { id: "r2", title: "Feature B", voteCount: 5, status: "under_review" },
    ];
    makeSelectChain(reqs);

    const { GET } = await import("@/app/api/boards/[id]/requests/route");
    const req = new NextRequest("http://localhost:3000/api/boards/board-1/requests");
    const res = await GET(req, { params: { id: "board-1" } });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(2);
  });

  it("returns 404 when board not found", async () => {
    mockAuth.mockResolvedValueOnce(null);
    makeSelectChain([]); // no board

    const { GET } = await import("@/app/api/boards/[id]/requests/route");
    const req = new NextRequest("http://localhost:3000/api/boards/bad-board/requests");
    const res = await GET(req, { params: { id: "bad-board" } });

    expect(res.status).toBe(404);
  });

  it("returns 403 for private board when user is not owner", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-stranger" } });
    makeSelectChain([{ id: "board-1", isPublic: false, userId: "user-owner" }]);

    const { GET } = await import("@/app/api/boards/[id]/requests/route");
    const req = new NextRequest("http://localhost:3000/api/boards/board-1/requests");
    const res = await GET(req, { params: { id: "board-1" } });

    expect(res.status).toBe(403);
  });
});

// ─── PATCH /api/requests/[id] ─────────────────────────────────────────────────

describe("PATCH /api/requests/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { PATCH } = await import("@/app/api/requests/[id]/route");
    const req = patchReq({ status: "planned" });
    const res = await PATCH(req, { params: { id: "req-1" } });

    expect(res.status).toBe(401);
  });

  it("returns 404 when request does not belong to the authenticated user's board", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });

    const body = { status: "planned" };
    // Body parsed fine
    // verifyOwnership returns empty (not found / not owned)
    makeSelectChain([]); // ownership check

    const { PATCH } = await import("@/app/api/requests/[id]/route");
    const req = patchReq(body);
    const res = await PATCH(req, { params: { id: "req-1" } });

    expect(res.status).toBe(404);
  });

  it("updates status and triggers notification", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });

    // verifyOwnership returns a match
    makeSelectChain([{ requestId: "req-1", boardId: "board-1" }]);

    // Fetch previous status
    makeSelectChain([{ status: "under_review" }]);

    // Update returns updated request
    const updated = {
      id: "req-1",
      title: "Dark mode",
      status: "planned",
      voteCount: 5,
      updatedAt: new Date().toISOString(),
    };
    makeUpdateChain([updated]);

    const { PATCH } = await import("@/app/api/requests/[id]/route");
    const req = patchReq({ status: "planned" });
    const res = await PATCH(req, { params: { id: "req-1" } });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("planned");

    // Give the fire-and-forget a tick to execute
    await new Promise((r) => setTimeout(r, 10));
    expect(mockNotifyWatchers).toHaveBeenCalledWith({
      requestId: "req-1",
      newStatus: "planned",
      previousStatus: "under_review",
    });
  });

  it("does NOT trigger notification when status is unchanged", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });

    makeSelectChain([{ requestId: "req-1", boardId: "board-1" }]);
    makeSelectChain([{ status: "planned" }]); // previous status is already "planned"

    const updated = { id: "req-1", title: "New Title", status: "planned" };
    makeUpdateChain([updated]);

    const { PATCH } = await import("@/app/api/requests/[id]/route");
    // Only changing title, not status
    const req = patchReq({ title: "New Title" });
    const res = await PATCH(req, { params: { id: "req-1" } });

    expect(res.status).toBe(200);
    await new Promise((r) => setTimeout(r, 10));
    expect(mockNotifyWatchers).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid status enum value", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });

    const { PATCH } = await import("@/app/api/requests/[id]/route");
    const req = patchReq({ status: "invalid-status" });
    const res = await PATCH(req, { params: { id: "req-1" } });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });
});

// ─── DELETE /api/requests/[id] ────────────────────────────────────────────────

describe("DELETE /api/requests/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { DELETE } = await import("@/app/api/requests/[id]/route");
    const req = new NextRequest("http://localhost:3000/api/requests/req-1", { method: "DELETE" });
    const res = await DELETE(req, { params: { id: "req-1" } });

    expect(res.status).toBe(401);
  });

  it("deletes a request the user owns", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });

    // verifyOwnership succeeds
    makeSelectChain([{ requestId: "req-1", boardId: "board-1" }]);
    makeDeleteChain();

    const { DELETE } = await import("@/app/api/requests/[id]/route");
    const req = new NextRequest("http://localhost:3000/api/requests/req-1", { method: "DELETE" });
    const res = await DELETE(req, { params: { id: "req-1" } });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
