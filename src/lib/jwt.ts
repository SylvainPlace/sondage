import { SignJWT, jwtVerify } from "jose";

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

export async function verifyUserToken(token: string): Promise<any> {
  const secret = new TextEncoder().encode(SECRET_KEY);
  
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (e) {
    throw new Error("Invalid Token");
  }
}
