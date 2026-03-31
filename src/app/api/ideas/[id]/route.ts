import { NextRequest, NextResponse } from "next/server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifyUserToken, getUserEmailFromToken } from "@/lib/jwt";

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
  const db = env.IDEAS_DB;

  try {
    const idea = await db
      .prepare(`SELECT author_email FROM ideas WHERE id = ?`)
      .bind(ideaId)
      .first() as { author_email: string } | null;

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    if (idea.author_email !== userEmail) {
      return NextResponse.json({ error: "Not authorized to delete this idea" }, { status: 403 });
    }

    await db.prepare(`DELETE FROM idea_votes WHERE idea_id = ?`).bind(ideaId).run();
    await db.prepare(`DELETE FROM ideas WHERE id = ?`).bind(ideaId).run();

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}