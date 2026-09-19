import { createSessionsHandler } from "@/features/auth/server/sessions-http";
import { getAuthRuntime } from "@/features/auth/server/runtime";

async function handle(request: Request): Promise<Response> {
  const runtime = await getAuthRuntime();
  return createSessionsHandler({
    db: runtime.db,
    sessionPepper: runtime.sessionPepper,
  })(request);
}

export const GET = handle;
export const DELETE = handle;
