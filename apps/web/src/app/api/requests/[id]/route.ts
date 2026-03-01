export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, boards, requests, eq, and } from "@feedbackkit/db";
import { z } from "zod";
import { notifyWatchersOnStatusChange } from "@/lib/notifications";

const updateRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(["under_review", "planned", "in_progress", "shipped", "wont_do"]).optional(),
  internalNote: z.string().max(2000).nullable().optional(),
});

// Helper: verify the request belongs to a board owned by the current user
async function verifyOwnership(requestId: string, userId: string) {
  const result = await db
    .select({ requestId: requests.id, boardId: boards.id })
    .from(requests)
    .innerJoin(boards, eq(requests.boardId, boards.id))
    .where(and(eq(requests.id, requestId), eq(boards.userId, userId)))
    .limit(1);

  return result[0] ?? null;
}

// GET /api/requests/:id — get single request (public if board is public)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [request] = await db
      .select()
      .from(requests)
      .where(eq(requests.id, params.id))
      .limit(1);

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Check board visibility
    const [board] = await db
      .select()
      .from(boards)
      .where(eq(boards.id, request.boardId))
      .limit(1);

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    if (!board.isPublic) {
      const session = await auth();
      if (!session?.user?.id || session.user.id !== board.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error("[GET /api/requests/:id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/requests/:id — admin only (board owner)
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
    const parsed = updateRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const ownership = await verifyOwnership(params.id, session.user.id);
    if (!ownership) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const updates: Partial<typeof requests.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (parsed.data.title !== undefined) updates.title = parsed.data.title;
    if (parsed.data.description !== undefined) updates.description = parsed.data.description;
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;
    if (parsed.data.internalNote !== undefined) updates.internalNote = parsed.data.internalNote;

    // Capture previous status before update (for notification comparison)
    const [existingRequest] = await db
      .select({ status: requests.status })
      .from(requests)
      .where(eq(requests.id, params.id))
      .limit(1);
    const previousStatus = existingRequest?.status ?? null;

    const [updated] = await db
      .update(requests)
      .set(updates)
      .where(eq(requests.id, params.id))
      .returning();

    // Notify watchers if status changed (fire-and-forget)
    if (parsed.data.status && parsed.data.status !== previousStatus) {
      notifyWatchersOnStatusChange({
        requestId: params.id,
        newStatus: parsed.data.status,
        previousStatus,
      }).catch((err) => {
        console.error("[PATCH /api/requests/:id] Notification error:", err);
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/requests/:id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/requests/:id — admin only (board owner)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ownership = await verifyOwnership(params.id, session.user.id);
    if (!ownership) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    await db.delete(requests).where(eq(requests.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/requests/:id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
