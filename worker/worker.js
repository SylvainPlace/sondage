export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin");
    const allowedOrigins = [
      "https://sondage-2rm.pages.dev",
      "http://localhost:8000",
    ];

    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigins.includes(origin)
        ? origin
        : "https://sondage-2rm.pages.dev",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === "/login" && request.method === "POST") {
      try {
        const { email, password } = await request.json();

        if (password !== env.GLOBAL_PASSWORD) {
          return new Response(
            JSON.stringify({ error: "Mot de passe incorrect" }),
            {
              status: 401,
              headers: corsHeaders,
            }
          );
        }

        const whitelist = await getWhitelist(env);
        if (!whitelist.includes(email.toLowerCase().trim())) {
          return new Response(
            JSON.stringify({
              error:
                "Email non autorisé. Utilisez l'adresse de votre inscription à l'association. En cas d'oubli, contactez un administrateur.",
            }),
            {
              status: 403,
              headers: corsHeaders,
            }
          );
        }

        // HS256 is used for simplicity/speed over RS256 for session tokens.
        // Expires in 30 days (2592000 seconds)
        const payload = {
          sub: email,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 2592000,
        };

        const token = await signJWT(payload, env.JWT_SECRET);

        return new Response(JSON.stringify({ token }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Invalid Request" }), {
          status: 400,
          headers: corsHeaders,
        });
      }
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const token = authHeader.split(" ")[1];
    try {
      await verifyJWT(token, env.JWT_SECRET);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid Token" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);
    let response;
    response = await cache.match(cacheKey);

    if (!response) {
      try {
        if (
          !env.GCP_SERVICE_ACCOUNT_EMAIL ||
          !env.GCP_PRIVATE_KEY ||
          !env.SPREADSHEET_ID
        ) {
          throw new Error("Missing configuration (Secrets).");
        }

        const token = await getAccessToken(
          env.GCP_SERVICE_ACCOUNT_EMAIL,
          env.GCP_PRIVATE_KEY
        );

        const sheetName = "Réponses au formulaire 1";
        const googleUrl = `https://sheets.googleapis.com/v4/spreadsheets/${
          env.SPREADSHEET_ID
        }/values/${encodeURIComponent(sheetName)}`;

        const sheetResponse = await fetch(googleUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
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

        const headers = rawData.values[0];
        const rows = rawData.values.slice(1);

        // MAPPING bridges the gap between Google Sheet column names (which might change) and stable JSON keys.
        const MAPPING = {
          annee_diplome: "Année de diplôme",
          sexe: "Sexe",
          departement: "Département actuel de travail",
          secteur: "Secteur d’activité",
          type_structure: "Type de structure",
          poste: "Poste actuel",
          experience: "Nombre d’années d’expérience (depuis le diplôme)",
          salaire_brut: "Salaire brut annuel actuel (hors primes)",
          primes: "Primes / variable annuel",
          avantages: "Avantages particuliers (optionnel)",
          conseil:
            "Un conseil, un retour d’expérience, une anecdote ? (facultatif)",
        };

        const headerMap = {};
        headers.forEach((h, i) => (headerMap[h] = i));

        const formattedData = rows.map((row) => {
          const item = {};
          for (const [jsonKey, sheetColumnName] of Object.entries(MAPPING)) {
            let colIndex = headerMap[sheetColumnName];

            if (colIndex === undefined) {
              const foundHeader = headers.find((h) =>
                h.includes(sheetColumnName)
              );
              if (foundHeader) colIndex = headerMap[foundHeader];
            }

            if (colIndex !== undefined && row[colIndex] !== undefined) {
              let value = row[colIndex];
              if (jsonKey === "experience") {
                item[jsonKey] = parseExperience(value);
              } else if (jsonKey === "annee_diplome") {
                const num = parseInt(value, 10);
                item[jsonKey] = isNaN(num) ? 0 : num;
              } else if (jsonKey === "secteur") {
                item[jsonKey] = normalizeSector(value);
              } else if (jsonKey === "type_structure") {
                item[jsonKey] = normalizeStructure(value);
              } else if (jsonKey === "poste") {
                item[jsonKey] = normalizeJob(value);
              } else if (jsonKey === "departement") {
                item[jsonKey] = normalizeRegion(value);
              } else {
                item[jsonKey] = String(value).trim();
              }
            } else {
              item[jsonKey] = "";
            }
          }
          return item;
        });

        response = new Response(JSON.stringify(formattedData), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=36000, s-maxage=36000",
          },
        });

        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        });
      }
    }

    return response;
  },
};

async function signJWT(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));

  const signature = await hmacSign(
    `${encodedHeader}.${encodedPayload}`,
    secret
  );
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

async function verifyJWT(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token structure");

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = await hmacSign(
    `${encodedHeader}.${encodedPayload}`,
    secret
  );

  if (signature !== expectedSignature) throw new Error("Invalid signature");

  const payload = JSON.parse(
    atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/"))
  );

  if (payload.exp && Date.now() / 1000 > payload.exp) {
    throw new Error("Token expired");
  }

  return payload;
}

async function hmacSign(data, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data));

  return base64url(null, signature);
}

async function getWhitelist(env) {
  try {
    const token = await getAccessToken(
      env.GCP_SERVICE_ACCOUNT_EMAIL,
      env.GCP_PRIVATE_KEY
    );
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.SPREADSHEET_ID}/values/Whitelist!A:A`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.values) return [];

    return data.values.flat().map((email) => email.toLowerCase().trim());
  } catch (e) {
    console.error("Whitelist fetch error", e);
    return [];
  }
}

// Logic for converting ranges (e.g., "2-5" -> average) and handling strings like "10+".
function parseExperience(str) {
  if (!str) return 0;
  str = String(str).trim();
  if (str.includes("+")) return parseInt(str);

  const parts = str.match(/(\d+)-(\d+)/);
  if (parts) {
    return Math.ceil((parseInt(parts[1]) + parseInt(parts[2])) / 2);
  }
  return parseInt(str) || 0;
}

function normalizeSector(str) {
  if (!str) return "Non renseigné";
  const s = str.toLowerCase();

  if (s.includes("logiciel santé") || s.includes("logiciel médical"))
    return "Éditeur Logiciel Santé";

  if (
    s.includes("établissement de santé") ||
    s.includes("médico-social") ||
    s.includes("hôpital") ||
    s.includes("clinique") ||
    s.includes("laboratoire") ||
    s.includes("soins")
  )
    return "Structure de Soins";

  if (
    s.includes("public") ||
    s.includes("ars") ||
    s.includes("ans") ||
    s.includes("ministère") ||
    s.includes("gip")||
    s.includes("doctorat")||
    s.includes("recherche")
  )
    return "Institution Publique";

  if (
    s.includes("esn") ||
    s.includes("conseil") ||
    s.includes("freelance") ||
    s.includes("client")
  )
    return "ESN / Conseil";

  if (
    s.includes("pharma") ||
    s.includes("medtech") ||
    s.includes("biotech") ||
    s.includes("dispositif médical")
  )
    return "Industrie Santé";

  if (
    s.includes("banque") ||
    s.includes("bancaire") ||
    s.includes("assurance") ||
    s.includes("insurtech") ||
    s.includes("finance")
  )
    return "Banque / Assurance";

  if (
    s.includes("éditeur") ||
    s.includes("logiciel") ||
    s.includes("saas") ||
    s.includes("platform")
  )
    return "Éditeur Logiciel (Autre)";

  if (
    s.includes("tech") ||
    s.includes("startup") ||
    s.includes("industrie") ||
    s.includes("télécom") ||
    s.includes("sécurité") ||
    s.includes("security") ||
    s.includes("recherche")||
    s.includes("compagnie")||
    s.includes("autre")||
    s.includes("client")||
    s.includes("free-lance")
  )
    return "Tech / Industrie / Autre";

  return "Autre";
}

function normalizeJob(str) {
  if (!str) return "Non renseigné";
  const s = str.toLowerCase();

  if (
    s.includes("product") ||
    s.includes("po") ||
    s.includes("chef de projet") ||
    s.includes("cheffe de projet") ||
    s.includes("projet") ||
    s.includes("agile") ||
    s.includes("scrum")
  )
    return "Chef de Projet / Product";

  if (
    s.includes("développeur") ||
    s.includes("développeuse") ||
    s.includes("dev") ||
    s.includes("software") ||
    s.includes("ingénieur logiciel") ||
    s.includes("programmer") ||
    s.includes("java") ||
    s.includes("web")
  )
    return "Développeur / Ingénieur";

  if (
    s.includes("tech lead") ||
    s.includes("lead") ||
    s.includes("architecte") ||
    s.includes("principal")
  )
    return "Tech Lead / Architecte";

  if (
    s.includes("data") ||
    s.includes("bi ") ||
    s.includes("business analyst") ||
    s.endsWith(" bi")
  )
    return "Data / BI";

  if (
    s.includes("devops") ||
    s.includes("système") ||
    s.includes("réseau") ||
    s.includes("sécurité") ||
    s.includes("admin") ||
    s.includes("cloud") ||
    s.includes("sre") ||
    s.includes("cyber")
  )
    return "DevOps / Infra / Sécurité";

  if (
    s.includes("consultant") ||
    s.includes("intégrateur") ||
    s.includes("intératrice") ||
    s.includes("support")
  )
    return "Consultant / Intégrateur";

  if (
    s.includes("manager") ||
    s.includes("directeur") ||
    s.includes("responsable") ||
    s.includes("head of")
  )
    return "Manager / Directeur";

  if (
    s.includes("recherche") ||
    s.includes("r&d") ||
    s.includes("doctorant") ||
    s.includes("thèse")
  )
    return "Recherche / R&D";

  return "Autre";
}

function normalizeStructure(str) {
  if (!str) return "Non renseigné";
  const s = str.toLowerCase().trim();

  if (s.includes("start-up") || s.includes("startup") || s.includes("scale"))
    return "Start-up";

  if (s.includes("pme")) return "PME";

  if (s.includes("eti")) return "ETI";

  if (s.includes("grand groupe") || s.includes("entreprise"))
    return "Grand groupe";

  if (
    s.includes("public") ||
    s.includes("administration") ||
    s.includes("gip") ||
    s.includes("groupement") ||
    s.includes("université") ||
    s.includes("recherche") ||
    s.includes("numih") ||
    s.includes("hôpital")
  )
    return "Administration publique";

  if (s.includes("freelance") || s.includes("indépendant"))
    return "Freelance / Indépendant";

  return "Autre";
}

function normalizeRegion(str) {
  if (!str) return "Non renseigné";
  const s = str.toLowerCase().trim();

  if (s.includes("télétravail")) return "Full Télétravail";

  if (
    s.includes("autre pays") ||
    s.includes("monaco") ||
    s.includes("suisse") ||
    s.includes("luxembourg") ||
    s.includes("belgique") ||
    s.includes("royaume-uni") ||
    s.includes("allemagne") ||
    s.includes("canada")
  )
    return "International";

  if (
    s.includes("haute-garonne") ||
    s.includes("31") ||
    s.includes("tarn") ||
    s.includes("81") ||
    s.includes("ariège") ||
    s.includes("09") ||
    s.includes("gers") ||
    s.includes("32") ||
    s.includes("hérault") ||
    s.includes("34") ||
    s.includes("lot") ||
    s.includes("46") ||
    s.includes("hautes-pyrenées") ||
    s.includes("65") ||
    s.includes("pyrenées-orientales") ||
    s.includes("66") ||
    s.includes("tarn-et-garonne") ||
    s.includes("82") ||
    s.includes("aveyron") ||
    s.includes("12") ||
    s.includes("lozère") ||
    s.includes("48") ||
    s.includes("aude") ||
    s.includes("11") ||
    s.includes("gard") ||
    s.includes("30")
  )
    return "Occitanie";

  if (
    s.includes("paris") ||
    s.includes("75") ||
    s.includes("hauts-de-seine") ||
    s.includes("92") ||
    s.includes("seine-saint-denis") ||
    s.includes("93") ||
    s.includes("val-de-marne") ||
    s.includes("94") ||
    s.includes("seine-et-marne") ||
    s.includes("77") ||
    s.includes("yvelines") ||
    s.includes("78") ||
    s.includes("essonne") ||
    s.includes("91") ||
    s.includes("val-d'oise") ||
    s.includes("95")
  )
    return "Île-de-France";

  if (
    s.includes("gironde") ||
    s.includes("33") ||
    s.includes("haute-vienne") ||
    s.includes("87") ||
    s.includes("pyrénées-atlantiques") ||
    s.includes("64") ||
    s.includes("landes") ||
    s.includes("40") ||
    s.includes("dordogne") ||
    s.includes("24") ||
    s.includes("lot-et-garonne") ||
    s.includes("47")
  )
    return "Nouvelle-Aquitaine";

  if (
    s.includes("rhône") ||
    s.includes("69") ||
    s.includes("puy-de-dôme") ||
    s.includes("63") ||
    s.includes("isère") ||
    s.includes("38") ||
    s.includes("ain") ||
    s.includes("01") ||
    s.includes("loire") ||
    s.includes("42") ||
    s.includes("savoie") ||
    s.includes("73") ||
    s.includes("74")
  )
    return "Auvergne-Rhône-Alpes";

  if (
    s.includes("finistère") ||
    s.includes("29") ||
    s.includes("morbihan") ||
    s.includes("56") ||
    s.includes("ille-et-vilaine") ||
    s.includes("35") ||
    s.includes("côtes-d'armor") ||
    s.includes("22")
  )
    return "Bretagne";

  if (
    s.includes("loire-atlantique") ||
    s.includes("44") ||
    s.includes("maine-et-loire") ||
    s.includes("49") ||
    s.includes("mayenne") ||
    s.includes("53") ||
    s.includes("sarthe") ||
    s.includes("72") ||
    s.includes("vendée") ||
    s.includes("85")
  )
    return "Pays de la Loire";

  if (
    s.includes("bouches-du-rhône") ||
    s.includes("13") ||
    s.includes("var") ||
    s.includes("83") ||
    s.includes("alpes-maritimes") ||
    s.includes("06") ||
    s.includes("vaucluse") ||
    s.includes("84")
  )
    return "PACA / Sud";

  if (
    s.includes("bas-rhin") ||
    s.includes("67") ||
    s.includes("haut-rhin") ||
    s.includes("68") ||
    s.includes("moselle") ||
    s.includes("57") ||
    s.includes("meurthe-et-moselle") ||
    s.includes("54")
  )
    return "Grand Est";

  if (
    s.includes("indre-et-loire") ||
    s.includes("37") ||
    s.includes("loiret") ||
    s.includes("45")
  )
    return "Centre-Val de Loire";

  if (
    s.includes("réunion") ||
    s.includes("974") ||
    s.includes("polynésie") ||
    s.includes("987") ||
    s.includes("guadeloupe") ||
    s.includes("971") ||
    s.includes("martinique") ||
    s.includes("972") ||
    s.includes("guyane") ||
    s.includes("973")
  )
    return "DOM-TOM";

  return "Autre Région";
}

async function getAccessToken(clientEmail, privateKey) {
  // replace(/\\n/g, "\n") fixes common environment variable formatting issues with private keys.
  const pem = privateKey.replace(/\\n/g, "\n");

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

async function sign(content, privateKeyPem) {
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
