import { createActivationRequestHandler } from "@/features/auth/server/activation-request-http";
import { getAuthRuntime } from "@/features/auth/server/runtime";

export async function POST(request: Request): Promise<Response> {
  const runtime = await getAuthRuntime();
  return createActivationRequestHandler({
    db: runtime.db,
    email: runtime.email,
    humanVerification: runtime.humanVerification,
    pepper: runtime.activationPepper,
  })(request);
}
