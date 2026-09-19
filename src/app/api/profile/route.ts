import { getSessionRuntime } from "@/features/auth/server/runtime";
import { createProfileHandler } from "@/features/profile/server/profile-http";

async function handle(request: Request): Promise<Response> {
  const runtime = await getSessionRuntime();
  return createProfileHandler({
    db: runtime.db,
    sessionPepper: runtime.sessionPepper,
  })(request);
}

export const GET = handle;
export const PUT = handle;
