import { createActivationVerifyHandler } from "@/features/auth/server/activation-verify-http";
import { getAuthRuntime } from "@/features/auth/server/runtime";

export async function POST(request: Request): Promise<Response> {
  const runtime = await getAuthRuntime();
  return createActivationVerifyHandler({
    db: runtime.db,
    pepper: runtime.activationPepper,
  })(request);
}
