import { createLoginHandler } from "@/features/auth/server/login-http";
import { getAuthRuntime } from "@/features/auth/server/runtime";

export async function POST(request: Request): Promise<Response> {
  const runtime = await getAuthRuntime();
  return createLoginHandler({
    db: runtime.db,
    identity: runtime.identity,
    sessionPepper: runtime.sessionPepper,
  })(request);
}
