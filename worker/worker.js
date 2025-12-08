export default {
  async fetch(request, env, ctx) {
    // CORS Headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // Change to your domain in production
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Cache Check (Cloudflare Cache API)
    const cache = caches.default;
    const cacheUrl = new URL(request.url);
    // Use a specific cache key (e.g., ignore query params if you always want the same data)
    const cacheKey = new Request(cacheUrl.toString(), request);
    
    let response = await cache.match(cacheKey);

    if (!response) {
        try {
            // Check Configuration
            if (!env.GCP_SERVICE_ACCOUNT_EMAIL || !env.GCP_PRIVATE_KEY || !env.SPREADSHEET_ID) {
                throw new Error("Missing configuration (Secrets).");
            }

            // Get Google Access Token
            const token = await getAccessToken(env.GCP_SERVICE_ACCOUNT_EMAIL, env.GCP_PRIVATE_KEY);

            // Fetch Sheet Data
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

            // Transform Data (Server-Side Formatting)
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
                        } else if (jsonKey === 'departement') {
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

            // Create Response
            response = new Response(JSON.stringify(formattedData), {
                headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                // Cache Control: Cache for 1 hour (3600s) in CDN and Browser
                "Cache-Control": "public, max-age=3600, s-maxage=3600",
                },
            });

            // Save to Cache
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

  // Éditeur Logiciel Santé (Priorité)
  if (s.includes("logiciel santé") || s.includes("logiciel médical")) return "Éditeur Logiciel Santé";

  // Structure de Soins
  if (s.includes("établissement de santé") || s.includes("médico-social") || s.includes("hôpital") || s.includes("clinique") || s.includes("laboratoire") || s.includes("soins")) return "Structure de Soins";

  // Institution Publique
  if (s.includes("public") || s.includes("ars") || s.includes("ans") || s.includes("ministère") || s.includes("gip")) return "Institution Publique";

  // ESN / Conseil
  if (s.includes("esn") || s.includes("conseil") || s.includes("freelance") || s.includes("client")) return "ESN / Conseil";

  // Industrie Santé
  if (s.includes("pharma") || s.includes("medtech") || s.includes("biotech") || s.includes("dispositif médical")) return "Industrie Santé";

  // Banque / Assurance
  if (s.includes("banque") || s.includes("bancaire") || s.includes("assurance") || s.includes("insurtech") || s.includes("finance")) return "Banque / Assurance";

  // Éditeur Logiciel (Autre)
  if (s.includes("éditeur") || s.includes("logiciel") || s.includes("saas") || s.includes("platform")) return "Éditeur Logiciel (Autre)";

  // Tech / Industrie / Autre
  if (s.includes("tech") || s.includes("startup") || s.includes("industrie") || s.includes("télécom") || s.includes("sécurité") || s.includes("recherche")) return "Tech / Industrie / Autre";

  return "Autre";
}

function normalizeJob(str) {
  if (!str) return "Non renseigné";
  const s = str.toLowerCase();

  // Chef de Projet / Product (Product Owner, PM, CdP, Scrum Master)
  if (s.includes("product") || s.includes("po") || s.includes("chef de projet") || s.includes("cheffe de projet") || s.includes("projet") || s.includes("agile") || s.includes("scrum")) return "Chef de Projet / Product";

  // Développeur / Ingénieur (Dev, Software Eng, Fullstack)
  if (s.includes("développeur") || s.includes("développeuse") || s.includes("dev") || s.includes("software") || s.includes("ingénieur logiciel") || s.includes("programmer") || s.includes("java") || s.includes("web")) return "Développeur / Ingénieur";

  // Tech Lead / Architecte
  if (s.includes("tech lead") || s.includes("lead") || s.includes("architecte") || s.includes("principal")) return "Tech Lead / Architecte";

  // Data / BI
  if (s.includes("data") || s.includes("bi ") || s.includes("business analyst") || s.endsWith(" bi")) return "Data / BI";

  // DevOps / Infra / Sécurité
  if (s.includes("devops") || s.includes("système") || s.includes("réseau") || s.includes("sécurité") || s.includes("admin") || s.includes("cloud") || s.includes("sre") || s.includes("cyber")) return "DevOps / Infra / Sécurité";

  // Consultant / Intégrateur
  if (s.includes("consultant") || s.includes("intégrateur") || s.includes("intératrice") || s.includes("support")) return "Consultant / Intégrateur";

  // Manager / Directeur
  if (s.includes("manager") || s.includes("directeur") || s.includes("responsable") || s.includes("head of")) return "Manager / Directeur";

  // Recherche / R&D
  if (s.includes("recherche") || s.includes("r&d") || s.includes("doctorant") || s.includes("thèse")) return "Recherche / R&D";

  return "Autre";
}

function normalizeRegion(str) {
  if (!str) return "Non renseigné";
  const s = str.toLowerCase().trim();

  // Télétravail
  if (s.includes("télétravail")) return "Full Télétravail";

  // International
  if (s.includes("autre pays") || s.includes("monaco") || s.includes("suisse") || s.includes("luxembourg") || s.includes("belgique") || s.includes("royaume-uni") || s.includes("allemagne") || s.includes("canada")) return "International";

  // Occitanie (31, 81, 09, 32, 34, 46, 65, 66, 82, 12, 48, 11, 30)
  if (s.includes("haute-garonne") || s.includes("31") || 
      s.includes("tarn") || s.includes("81") || 
      s.includes("ariège") || s.includes("09") || 
      s.includes("gers") || s.includes("32") || 
      s.includes("hérault") || s.includes("34") ||
      s.includes("lot") || s.includes("46") ||
      s.includes("hautes-pyrenées") || s.includes("65") ||
      s.includes("pyrenées-orientales") || s.includes("66") ||
      s.includes("tarn-et-garonne") || s.includes("82") ||
      s.includes("aveyron") || s.includes("12") ||
      s.includes("lozère") || s.includes("48") ||
      s.includes("aude") || s.includes("11") ||
      s.includes("gard") || s.includes("30")) return "Occitanie";

  // Île-de-France (75, 92, 93, 94, 77, 78, 91, 95)
  if (s.includes("paris") || s.includes("75") || 
      s.includes("hauts-de-seine") || s.includes("92") || 
      s.includes("seine-saint-denis") || s.includes("93") || 
      s.includes("val-de-marne") || s.includes("94") ||
      s.includes("seine-et-marne") || s.includes("77") ||
      s.includes("yvelines") || s.includes("78") ||
      s.includes("essonne") || s.includes("91") ||
      s.includes("val-d'oise") || s.includes("95")) return "Île-de-France";

  // Nouvelle-Aquitaine (33, 87, 64, 40, 24, 47)
  if (s.includes("gironde") || s.includes("33") || 
      s.includes("haute-vienne") || s.includes("87") || 
      s.includes("pyrénées-atlantiques") || s.includes("64") ||
      s.includes("landes") || s.includes("40") ||
      s.includes("dordogne") || s.includes("24") ||
      s.includes("lot-et-garonne") || s.includes("47")) return "Nouvelle-Aquitaine";

  // Auvergne-Rhône-Alpes (69, 63, 38, 01, 42, 73, 74)
  if (s.includes("rhône") || s.includes("69") || 
      s.includes("puy-de-dôme") || s.includes("63") ||
      s.includes("isère") || s.includes("38") ||
      s.includes("ain") || s.includes("01") ||
      s.includes("loire") || s.includes("42") ||
      s.includes("savoie") || s.includes("73") ||
      s.includes("74")) return "Auvergne-Rhône-Alpes";

  // Bretagne (29, 56, 35, 22)
  if (s.includes("finistère") || s.includes("29") || 
      s.includes("morbihan") || s.includes("56") ||
      s.includes("ille-et-vilaine") || s.includes("35") ||
      s.includes("côtes-d'armor") || s.includes("22")) return "Bretagne";

  // Pays de la Loire (44, 49, 53, 72, 85)
  if (s.includes("loire-atlantique") || s.includes("44") ||
      s.includes("maine-et-loire") || s.includes("49") ||
      s.includes("mayenne") || s.includes("53") ||
      s.includes("sarthe") || s.includes("72") ||
      s.includes("vendée") || s.includes("85")) return "Pays de la Loire";

  // PACA (13, 83, 06, 84, 04, 05)
  if (s.includes("bouches-du-rhône") || s.includes("13") || 
      s.includes("var") || s.includes("83") ||
      s.includes("alpes-maritimes") || s.includes("06") ||
      s.includes("vaucluse") || s.includes("84")) return "PACA / Sud";

  // Grand Est (67, 68, 57, 54, 88, 10, 51, 08, 52, 55)
  if (s.includes("bas-rhin") || s.includes("67") || 
      s.includes("haut-rhin") || s.includes("68") ||
      s.includes("moselle") || s.includes("57") ||
      s.includes("meurthe-et-moselle") || s.includes("54")) return "Grand Est";

  // Centre-Val de Loire (37, 45, 18, 28, 36, 41)
  if (s.includes("indre-et-loire") || s.includes("37") ||
      s.includes("loiret") || s.includes("45")) return "Centre-Val de Loire";

  // DOM-TOM (971, 972, 973, 974, 976, 987, 988)
  if (s.includes("réunion") || s.includes("974") || 
      s.includes("polynésie") || s.includes("987") ||
      s.includes("guadeloupe") || s.includes("971") ||
      s.includes("martinique") || s.includes("972") ||
      s.includes("guyane") || s.includes("973")) return "DOM-TOM";

  return "Autre Région";
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
