import { NextRequest, NextResponse } from "next/server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifyUserToken, getUserEmailFromToken } from "@/lib/jwt";
import type { Idea } from "@/types";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const { id: ideaId } = await params;
  const { env } = getCloudflareContext();

  try {
    const checkVote = await env.IDEAS_DB.prepare(
      `SELECT 1 FROM idea_votes WHERE idea_id = ? AND user_email = ?`,
    )
      .bind(ideaId, userEmail)
      .first();

    if (checkVote) {
      return NextResponse.json({ error: "Already voted" }, { status: 400 });
    }

    await env.IDEAS_DB.prepare(`INSERT INTO idea_votes (idea_id, user_email) VALUES (?, ?)`).bind(
      ideaId,
      userEmail,
    );

    await env.IDEAS_DB.prepare(`UPDATE ideas SET upvotes = upvotes + 1 WHERE id = ?`).bind(ideaId);

    const updatedIdea = (await env.IDEAS_DB.prepare(
      `SELECT i.id, i.title, i.description, i.created_at, i.upvotes,
              1 as userHasVoted
       FROM ideas i
       WHERE i.id = ?`,
    )
      .bind(ideaId)
      .first()) as Idea | null;

    if (!updatedIdea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    return NextResponse.json({ idea: updatedIdea });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
