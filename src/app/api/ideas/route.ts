import { NextRequest, NextResponse } from "next/server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifyUserToken, getUserEmailFromToken } from "@/lib/jwt";
import type { Idea, IdeaFormData } from "@/types";

function generateId(): string {
  return crypto.randomUUID();
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await verifyUserToken(token);
  } catch {
    return NextResponse.json({ error: "Invalid Token" }, { status: 403 });
  }

  const userEmail = getUserEmailFromToken(token);
  const { env } = getCloudflareContext();

  try {
    const db = env.IDEAS_DB;
    const ideasResult = await db
      .prepare(
        `SELECT i.id, i.title, i.description, i.created_at, i.upvotes, i.author_email, i.is_public,
              EXISTS(SELECT 1 FROM idea_votes iv WHERE iv.idea_id = i.id AND iv.user_email = ?) as userHasVoted
        FROM ideas i
        WHERE i.is_public = 1 OR i.author_email = ?
        ORDER BY i.upvotes DESC, i.created_at DESC
        LIMIT 50`,
      )
      .bind(userEmail ?? "", userEmail ?? "")
      .all();

    const ideas = ideasResult.results as unknown as (Idea & { author_email: string })[];

    const ideasWithMeta = ideas.map((idea) => ({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      created_at: idea.created_at,
      upvotes: idea.upvotes,
      userHasVoted: idea.userHasVoted,
      userIsAuthor: idea.author_email === userEmail,
      isPublic: idea.isPublic,
    }));

    return NextResponse.json({ ideas: ideasWithMeta });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await verifyUserToken(token);
  } catch {
    return NextResponse.json({ error: "Invalid Token" }, { status: 403 });
  }

  const userEmail = getUserEmailFromToken(token);
  if (!userEmail) {
    return NextResponse.json({ error: "User email not found" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as IdeaFormData & { isPublic?: boolean };

  if (!body.title || body.title.trim().length === 0) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (body.title.length > 200) {
    return NextResponse.json({ error: "Title too long (max 200 characters)" }, { status: 400 });
  }

  if (body.description && body.description.length > 500) {
    return NextResponse.json(
      { error: "Description too long (max 500 characters)" },
      { status: 400 },
    );
  }

  const { env } = getCloudflareContext();
  const db = env.IDEAS_DB;
  const id = generateId();
  const title = body.title.trim();
  const description = body.description?.trim() || null;
  const isPublic = body.isPublic ?? true;

  try {
    await db
      .prepare(
        `INSERT INTO ideas (id, title, description, author_email, is_public, upvotes) VALUES (?, ?, ?, ?, ?, 0)`,
      )
      .bind(id, title, description, userEmail, isPublic ? 1 : 0)
      .run();

    const newIdea: Idea = {
      id,
      title,
      description,
      created_at: new Date().toISOString(),
      upvotes: 0,
      userHasVoted: false,
      userIsAuthor: true,
      isPublic,
    };

    return NextResponse.json({ idea: newIdea }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
