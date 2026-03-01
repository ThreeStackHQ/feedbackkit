export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, boards, requests, eq, and, desc, asc } from "@feedbackkit/db";
import { z } from "zod";

const createRequestSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
});

// GET /api/boards/:boardId/requests — list requests (public boards open to all, private boards owner only)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  try {
    // Verify board exists
    const [board] = await db
      .select()
      .from(boards)
      .where(eq(boards.id, params.id))
      .limit(1);

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Private board requires ownership
    if (!board.isPublic) {
      if (!session?.user?.id || session.user.id !== board.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Parse sort param
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get("sort") ?? "votes"; // votes | date
    const status = searchParams.get("status"); // optional filter

    const conditions = [eq(requests.boardId, params.id)];
    if (status) {
      // Validate status is a valid enum value
      const validStatuses = ["under_review", "planned", "in_progress", "shipped", "wont_do"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
      }
    }

    const allRequests = await db
      .select()
      .from(requests)
      .where(and(...conditions))
      .orderBy(
        sort === "votes"
          ? desc(requests.voteCount)
          : desc(requests.createdAt)
      );

    return NextResponse.json(allRequests);
  } catch (error) {
    console.error("[GET /api/boards/:boardId/requests]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/boards/:boardId/requests — create request
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = createRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    // Verify board exists and is public (or user owns it)
    const session = await auth();
    const [board] = await db
      .select()
      .from(boards)
      .where(eq(boards.id, params.id))
      .limit(1);

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    if (!board.isPublic && (!session?.user?.id || session.user.id !== board.userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [request] = await db
      .insert(requests)
      .values({
        boardId: params.id,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        status: "under_review",
        voteCount: 0,
      })
      .returning();

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error("[POST /api/boards/:boardId/requests]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
