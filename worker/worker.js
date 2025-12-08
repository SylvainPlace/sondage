export default {
  async fetch(request, env, ctx) {
    // 1. CORS Headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // Change to your domain in production
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 2. Check Configuration
      if (!env.GCP_SERVICE_ACCOUNT_EMAIL || !env.GCP_PRIVATE_KEY || !env.SPREADSHEET_ID) {
        throw new Error("Missing configuration (Secrets).");
      }

      // 3. Get Google Access Token
      const token = await getAccessToken(env.GCP_SERVICE_ACCOUNT_EMAIL, env.GCP_PRIVATE_KEY);

      // 4. Fetch Sheet Data
      const sheetName = "Réponses au formulaire 1"; // Make sure this matches!
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}`;
      
      const sheetResponse = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!sheetResponse.ok) {
        const err = await sheetResponse.text();
        throw new Error(`Google API Error: ${err}`);
      }

      const data = await sheetResponse.json();

      // 5. Return Data
      return new Response(JSON.stringify(data), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }
  },
};

// --- Google Auth Helpers (Web Crypto API) ---

async function getAccessToken(clientEmail, privateKey) {
  // Clean up private key if it contains literal \n characters from env vars
  const pem = privateKey.replace(/\\n/g, '\n');
  
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedClaim = base64url(JSON.stringify(claim));
  const unsignedToken = `${encodedHeader}.${encodedClaim}`;

  const signature = await sign(unsignedToken, pem);
  const jwt = `${unsignedToken}.${signature}`;

  // Exchange JWT for Access Token
  const params = new URLSearchParams();
  params.append("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
  params.append("assertion", jwt);

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }
  
  return tokenData.access_token;
}

// Import key and sign
async function sign(content, privateKeyPem) {
  // Remove header/footer and newlines
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = privateKeyPem
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s/g, "");

  const binaryDer = str2ab(atob(pemContents));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(content)
  );

  return base64url(null, signature);
}

// Utilities
function base64url(str, buffer) {
  let base64;
  if (buffer) {
    base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  } else {
    base64 = btoa(str);
  }
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}
