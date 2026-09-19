import { createPasswordRecoveryCompleteHandler } from "@/features/auth/server/password-recovery-http";
import { getAuthRuntime } from "@/features/auth/server/runtime";

export async function POST(request: Request): Promise<Response> {
  const runtime = await getAuthRuntime();
  return createPasswordRecoveryCompleteHandler({
    db: runtime.db,
    identity: runtime.identity,
    pepper: runtime.activationPepper,
  })(request);
}
