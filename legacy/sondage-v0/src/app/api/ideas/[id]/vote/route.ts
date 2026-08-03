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

    await env.IDEAS_DB.batch([
      env.IDEAS_DB.prepare(`INSERT INTO idea_votes (idea_id, user_email) VALUES (?, ?)`).bind(
        ideaId,
        userEmail,
      ),
      env.IDEAS_DB.prepare(`UPDATE ideas SET upvotes = upvotes + 1 WHERE id = ?`).bind(ideaId),
    ]);

    const updatedIdea = (await env.IDEAS_DB.prepare(
      `SELECT i.id, i.title, i.description, i.created_at, i.upvotes, i.author_email, i.is_public,
              1 as userHasVoted
       FROM ideas i
       WHERE i.id = ?`,
    )
      .bind(ideaId)
      .first()) as (Idea & { author_email: string; is_public: number }) | null;

    if (!updatedIdea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    return NextResponse.json({
      idea: {
        id: updatedIdea.id,
        title: updatedIdea.title,
        description: updatedIdea.description,
        created_at: updatedIdea.created_at,
        upvotes: updatedIdea.upvotes,
        userHasVoted: true,
        userIsAuthor: updatedIdea.author_email === userEmail,
        isPublic: Boolean(updatedIdea.is_public),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    if (!checkVote) {
      return NextResponse.json({ error: "No vote to remove" }, { status: 400 });
    }

    await env.IDEAS_DB.batch([
      env.IDEAS_DB.prepare(`DELETE FROM idea_votes WHERE idea_id = ? AND user_email = ?`).bind(
        ideaId,
        userEmail,
      ),
      env.IDEAS_DB.prepare(`UPDATE ideas SET upvotes = upvotes - 1 WHERE id = ?`).bind(ideaId),
    ]);

    const updatedIdea = (await env.IDEAS_DB.prepare(
      `SELECT i.id, i.title, i.description, i.created_at, i.upvotes, i.author_email, i.is_public,
              0 as userHasVoted
       FROM ideas i
       WHERE i.id = ?`,
    )
      .bind(ideaId)
      .first()) as (Idea & { author_email: string; is_public: number }) | null;

    if (!updatedIdea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    return NextResponse.json({
      idea: {
        id: updatedIdea.id,
        title: updatedIdea.title,
        description: updatedIdea.description,
        created_at: updatedIdea.created_at,
        upvotes: updatedIdea.upvotes,
        userHasVoted: false,
        userIsAuthor: updatedIdea.author_email === userEmail,
        isPublic: Boolean(updatedIdea.is_public),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
