export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, boards, eq, and } from "@feedbackkit/db";
import { z } from "zod";
import { randomBytes } from "crypto";

const createBoardSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens").optional(),
});

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
  const suffix = randomBytes(3).toString("hex");
  return `${base}-${suffix}`;
}

// GET /api/boards — list user's boards
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userBoards = await db
      .select()
      .from(boards)
      .where(eq(boards.userId, session.user.id))
      .orderBy(boards.createdAt);

    return NextResponse.json(userBoards);
  } catch (error) {
    console.error("[GET /api/boards]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/boards — create board
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createBoardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, description, isPublic } = parsed.data;

    // Generate unique slug
    let slug = parsed.data.slug ?? generateSlug(name);
    let attempts = 0;

    while (attempts < 5) {
      const [existing] = await db
        .select({ id: boards.id })
        .from(boards)
        .where(eq(boards.slug, slug))
        .limit(1);

      if (!existing) break;
      slug = generateSlug(name);
      attempts++;
    }

    const [board] = await db
      .insert(boards)
      .values({
        userId: session.user.id,
        name,
        description: description ?? null,
        slug,
        isPublic,
      })
      .returning();

    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    console.error("[POST /api/boards]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
