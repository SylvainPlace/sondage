import { createReauthenticationHandler } from "@/features/auth/server/reauthentication-http";
import { getAuthRuntime } from "@/features/auth/server/runtime";

async function handle(request: Request): Promise<Response> {
  const runtime = await getAuthRuntime();
  return createReauthenticationHandler({
    db: runtime.db,
    identity: runtime.identity,
    sessionPepper: runtime.sessionPepper,
  })(request);
}

export const GET = handle;
export const POST = handle;
