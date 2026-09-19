import { createPasswordRecoveryRequestHandler } from "@/features/auth/server/password-recovery-http";
import { getAuthRuntime } from "@/features/auth/server/runtime";

export async function POST(request: Request): Promise<Response> {
  const runtime = await getAuthRuntime();
  return createPasswordRecoveryRequestHandler({
    db: runtime.db,
    email: runtime.email,
    humanVerification: runtime.humanVerification,
    pepper: runtime.activationPepper,
  })(request);
}
