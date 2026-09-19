import { createActivitiesHandler } from "@/features/activities/server/activities-http";
import { getSessionRuntime } from "@/features/auth/server/runtime";

async function handle(request: Request): Promise<Response> {
  const runtime = await getSessionRuntime();
  return createActivitiesHandler({
    db: runtime.db,
    sessionPepper: runtime.sessionPepper,
  })(request);
}

export const GET = handle;
export const POST = handle;
