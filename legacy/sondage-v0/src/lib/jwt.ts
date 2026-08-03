import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const SECRET_KEY = process.env.JWT_SECRET || "default_secret_dev_only";

export async function signUserToken(email: string): Promise<string> {
  const secret = new TextEncoder().encode(SECRET_KEY);
  const alg = "HS256";

  const jwt = await new SignJWT({ sub: email })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("30d") // 30 days
    .sign(secret);

  return jwt;
}

export async function verifyUserToken(token: string): Promise<JWTPayload> {
  const secret = new TextEncoder().encode(SECRET_KEY);

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    throw new Error("Invalid Token");
  }
}

export function getUserEmailFromToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) {
      return null;
    }
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return payload.sub || null;
  } catch {
    return null;
  }
}
