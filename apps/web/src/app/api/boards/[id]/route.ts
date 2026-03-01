export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, boards, eq, and } from "@feedbackkit/db";
import { z } from "zod";

const updateBoardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  isPublic: z.boolean().optional(),
});

// GET /api/boards/:id
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [board] = await db
      .select()
      .from(boards)
      .where(and(eq(boards.id, params.id), eq(boards.userId, session.user.id)))
      .limit(1);

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error("[GET /api/boards/:id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/boards/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = updateBoardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    // Verify ownership
    const [existing] = await db
      .select({ id: boards.id })
      .from(boards)
      .where(and(eq(boards.id, params.id), eq(boards.userId, session.user.id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const updates: Partial<typeof boards.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.description !== undefined) updates.description = parsed.data.description;
    if (parsed.data.isPublic !== undefined) updates.isPublic = parsed.data.isPublic;

    const [updated] = await db
      .update(boards)
      .set(updates)
      .where(eq(boards.id, params.id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/boards/:id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/boards/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [deleted] = await db
      .delete(boards)
      .where(and(eq(boards.id, params.id), eq(boards.userId, session.user.id)))
      .returning({ id: boards.id });

    if (!deleted) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/boards/:id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
