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

      const rawData = await sheetResponse.json();
      
      if (!rawData.values || rawData.values.length < 2) {
         throw new Error("No data found in sheet.");
      }

      // 5. Transform Data (Server-Side Formatting)
      const headers = rawData.values[0];
      const rows = rawData.values.slice(1);
      
      const MAPPING = {
        "annee_diplome": "Année de diplôme",
        "sexe": "Sexe",
        "departement": "Département actuel de travail",
        "secteur": "Secteur d’activité",
        "type_structure": "Type de structure",
        "poste": "Poste actuel",
        "experience": "Nombre d’années d’expérience (depuis le diplôme)",
        "salaire_brut": "Salaire brut annuel actuel (hors primes)",
        "primes": "Primes / variable annuel",
        "avantages": "Avantages particuliers (optionnel)",
        "conseil": "Un conseil, un retour d’expérience, une anecdote ? (facultatif)"
      };

      // Header Index Map
      const headerMap = {};
      headers.forEach((h, i) => headerMap[h] = i);

      const formattedData = rows.map(row => {
        const item = {};
        for (const [jsonKey, sheetColumnName] of Object.entries(MAPPING)) {
            let colIndex = headerMap[sheetColumnName];
            
            // Fuzzy match fallback
            if (colIndex === undefined) {
                const foundHeader = headers.find(h => h.includes(sheetColumnName));
                if (foundHeader) colIndex = headerMap[foundHeader];
            }

            if (colIndex !== undefined && row[colIndex] !== undefined) {
                let value = row[colIndex];
                // Type conversion
                if (jsonKey === 'experience') {
                    item[jsonKey] = parseExperience(value);
                } else if (jsonKey === 'annee_diplome') {
                    const num = parseInt(value, 10);
                    item[jsonKey] = isNaN(num) ? 0 : num;
                } else if (jsonKey === 'secteur') {
                    item[jsonKey] = normalizeSector(value);
                } else if (jsonKey === 'poste') {
                    item[jsonKey] = normalizeJob(value);
                } else {
                    item[jsonKey] = String(value).trim();
                }
            } else {
                item[jsonKey] = "";
            }
        }
        return item;
      });

      // 6. Return Clean JSON
      return new Response(JSON.stringify(formattedData), {
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

// --- Helpers ---

function parseExperience(str) {
  if (!str) return 0;
  str = String(str).trim();
  if (str.includes('+')) return parseInt(str); // "10+" -> 10
  
  const parts = str.match(/(\d+)-(\d+)/);
  if (parts) {
      return (parseInt(parts[1]) + parseInt(parts[2])) / 2;
  }
  return parseInt(str) || 0;
}

function normalizeSector(str) {
  if (!str) return "Non renseigné";
  const s = str.toLowerCase();

  // 1. Éditeur Logiciel Santé (Priorité)
  if (s.includes("logiciel santé") || s.includes("logiciel médical")) return "Éditeur Logiciel Santé";

  // 2. Structure de Soins
  if (s.includes("établissement de santé") || s.includes("médico-social") || s.includes("hôpital") || s.includes("clinique") || s.includes("laboratoire") || s.includes("soins")) return "Structure de Soins";

  // 3. Institution Publique
  if (s.includes("public") || s.includes("ars") || s.includes("ans") || s.includes("ministère") || s.includes("gip")) return "Institution Publique";

  // 4. ESN / Conseil
  if (s.includes("esn") || s.includes("conseil") || s.includes("freelance") || s.includes("client")) return "ESN / Conseil";

  // 5. Industrie Santé
  if (s.includes("pharma") || s.includes("medtech") || s.includes("biotech") || s.includes("dispositif médical")) return "Industrie Santé";

  // 6. Banque / Assurance
  if (s.includes("banque") || s.includes("bancaire") || s.includes("assurance") || s.includes("insurtech") || s.includes("finance")) return "Banque / Assurance";

  // 7. Éditeur Logiciel (Autre)
  if (s.includes("éditeur") || s.includes("logiciel") || s.includes("saas") || s.includes("platform")) return "Éditeur Logiciel (Autre)";

  // 8. Tech / Industrie / Autre
  if (s.includes("tech") || s.includes("startup") || s.includes("industrie") || s.includes("télécom") || s.includes("sécurité") || s.includes("recherche")) return "Tech / Industrie / Autre";

  return "Autre";
}

function normalizeJob(str) {
  if (!str) return "Non renseigné";
  const s = str.toLowerCase();

  // 1. Chef de Projet / Product (Product Owner, PM, CdP, Scrum Master)
  if (s.includes("product") || s.includes("po") || s.includes("chef de projet") || s.includes("cheffe de projet") || s.includes("projet") || s.includes("agile") || s.includes("scrum")) return "Chef de Projet / Product";

  // 2. Développeur / Ingénieur (Dev, Software Eng, Fullstack)
  if (s.includes("développeur") || s.includes("développeuse") || s.includes("dev") || s.includes("software") || s.includes("ingénieur logiciel") || s.includes("programmer") || s.includes("java") || s.includes("web")) return "Développeur / Ingénieur";

  // 3. Tech Lead / Architecte
  if (s.includes("tech lead") || s.includes("lead") || s.includes("architecte") || s.includes("principal")) return "Tech Lead / Architecte";

  // 4. Data / BI
  if (s.includes("data") || s.includes("bi ") || s.includes("business analyst") || s.endsWith(" bi")) return "Data / BI";

  // 5. DevOps / Infra / Sécurité
  if (s.includes("devops") || s.includes("système") || s.includes("réseau") || s.includes("sécurité") || s.includes("admin") || s.includes("cloud") || s.includes("sre") || s.includes("cyber")) return "DevOps / Infra / Sécurité";

  // 6. Consultant / Intégrateur
  if (s.includes("consultant") || s.includes("intégrateur") || s.includes("intératrice") || s.includes("support")) return "Consultant / Intégrateur";

  // 7. Manager / Directeur
  if (s.includes("manager") || s.includes("directeur") || s.includes("responsable") || s.includes("head of")) return "Manager / Directeur";

  // 8. Recherche / R&D
  if (s.includes("recherche") || s.includes("r&d") || s.includes("doctorant") || s.includes("thèse")) return "Recherche / R&D";

  return "Autre";
}

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
