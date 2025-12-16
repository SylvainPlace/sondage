// Google Auth Logic (Edge Compatible) using RS256 signing manually or with JOSE.
// Since we have the manual logic in worker.js, we can adapt it to TypeScript.
// However, utilizing 'jose' library is cleaner.

import { importPKCS8, SignJWT } from "jose";

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

type SheetsValuesResponse = {
  values?: unknown[][];
};

type CachedAccessToken = {
  token: string;
  expiresAtMs: number;
  clientEmail: string;
};

let cachedAccessToken: CachedAccessToken | null = null;

type CachedWhitelist = {
  emails: string[];
  expiresAtMs: number;
  spreadsheetId: string;
  clientEmail: string;
};

let cachedWhitelist: CachedWhitelist | null = null;

export async function getGoogleAccessToken(
  clientEmail: string,
  privateKey: string,
): Promise<string> {
  const nowMs = Date.now();
  if (
    cachedAccessToken &&
    cachedAccessToken.clientEmail === clientEmail &&
    cachedAccessToken.expiresAtMs > nowMs
  ) {
    return cachedAccessToken.token;
  }

  const pem = privateKey.replace(/\\n/g, "\n");

  // Using jose to sign the JWT for Google Auth
  const alg = "RS256";
  const pkcs8 = await importPKCS8(pem, alg);

  const now = Math.floor(Date.now() / 1000);
  
  const jwt = await new SignJWT({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
  })
    .setProtectedHeader({ alg, typ: "JWT" })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(pkcs8);

  const params = new URLSearchParams();
  params.append("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
  params.append("assertion", jwt);

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;
  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }

  const expiresInSec = typeof tokenData.expires_in === "number" ? tokenData.expires_in : 3600;
  const refreshSkewSec = 60;
  cachedAccessToken = {
    token: tokenData.access_token,
    clientEmail,
    expiresAtMs: nowMs + Math.max(0, expiresInSec - refreshSkewSec) * 1000,
  };

  return cachedAccessToken.token;
}

export async function getWhitelist(
  env: { GCP_SERVICE_ACCOUNT_EMAIL: string; GCP_PRIVATE_KEY: string; SPREADSHEET_ID: string },
): Promise<string[]> {
  try {
    const nowMs = Date.now();
    if (
      cachedWhitelist &&
      cachedWhitelist.clientEmail === env.GCP_SERVICE_ACCOUNT_EMAIL &&
      cachedWhitelist.spreadsheetId === env.SPREADSHEET_ID &&
      cachedWhitelist.expiresAtMs > nowMs
    ) {
      return cachedWhitelist.emails;
    }

    const token = await getGoogleAccessToken(
      env.GCP_SERVICE_ACCOUNT_EMAIL,
      env.GCP_PRIVATE_KEY,
    );
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.SPREADSHEET_ID}/values/Whitelist!A:A`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {return [];}

  const data = (await response.json()) as SheetsValuesResponse;
    if (!data.values) {return [];}

    const emails = data.values
      .flat()
      .map((email: unknown) => String(email).toLowerCase().trim())
      .filter(Boolean);

    cachedWhitelist = {
      emails,
      clientEmail: env.GCP_SERVICE_ACCOUNT_EMAIL,
      spreadsheetId: env.SPREADSHEET_ID,
      expiresAtMs: nowMs + 5 * 60 * 1000,
    };

    return emails;
  } catch (error: unknown) {
    console.error("Whitelist fetch error", error);
    return [];
  }
}
