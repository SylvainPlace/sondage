import { NextRequest, NextResponse } from "next/server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifyUserToken, getUserEmailFromToken } from "@/lib/jwt";
import type { Idea, IdeaFormData } from "@/types";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
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
    const ideasResult = await env.IDEAS_DB.prepare(
      `SELECT i.id, i.title, i.description, i.created_at, i.upvotes,
              EXISTS(SELECT 1 FROM idea_votes iv WHERE iv.idea_id = i.id AND iv.user_email = ?) as userHasVoted
       FROM ideas i
       ORDER BY i.upvotes DESC, i.created_at DESC
       LIMIT 50`,
    )
      .bind(userEmail ?? "")
      .all();

    const ideas = ideasResult.results as unknown as Idea[];

    return NextResponse.json({ ideas });
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

  const body = (await request.json().catch(() => ({}))) as IdeaFormData;

  if (!body.title || body.title.trim().length === 0) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (body.title.length > 200) {
    return NextResponse.json({ error: "Title too long (max 200 characters)" }, { status: 400 });
  }

  if (body.description && body.description.length > 2000) {
    return NextResponse.json(
      { error: "Description too long (max 2000 characters)" },
      { status: 400 },
    );
  }

  const { env } = getCloudflareContext();
  const id = generateId();
  const title = body.title.trim();
  const description = body.description?.trim() || null;

  try {
    await env.IDEAS_DB.prepare(
      `INSERT INTO ideas (id, title, description, upvotes) VALUES (?, ?, ?, 0)`,
    ).bind(id, title, description);

    const newIdea: Idea = {
      id,
      title,
      description,
      created_at: new Date().toISOString(),
      upvotes: 0,
      userHasVoted: false,
    };

    return NextResponse.json({ idea: newIdea }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
