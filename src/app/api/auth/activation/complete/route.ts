import { createActivationCompleteHandler } from "@/features/auth/server/activation-complete-http";
import { getAuthRuntime } from "@/features/auth/server/runtime";

export async function POST(request: Request): Promise<Response> {
  const runtime = await getAuthRuntime();
  return createActivationCompleteHandler({
    db: runtime.db,
    identity: runtime.identity,
    activationPepper: runtime.activationPepper,
    sessionPepper: runtime.sessionPepper,
  })(request);
}
