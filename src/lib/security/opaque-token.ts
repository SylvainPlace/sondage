const SESSION_TOKEN_BYTES = 32;

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createOpaqueSessionToken(): string {
  const bytes = new Uint8Array(SESSION_TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  return encodeBase64Url(bytes);
}

export async function hashOpaqueToken(token: string, pepper: string): Promise<string> {
  if (!token) {
    throw new Error("Session token is required");
  }

  if (!pepper) {
    throw new Error("Session pepper is required");
  }

  const input = new TextEncoder().encode(`${pepper}:${token}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return bytesToHex(new Uint8Array(digest));
}
