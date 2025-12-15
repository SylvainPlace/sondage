import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken } from "@/lib/jwt";
import { getGoogleAccessToken } from "@/lib/google-auth";
import {
  parseExperience,
  normalizeSector,
  normalizeStructure,
  normalizeJob,
  normalizeRegion,
} from "@/lib/normalization";
import { SurveyResponse } from "@/lib/types";

// Helper for backend (duplicate logic or import from shared)
function calculateXpGroup(years: number): string {
  if (isNaN(years)) return "Non renseigné";
  if (years <= 1) return "0-1 an";
  if (years <= 3) return "2-3 ans";
  if (years <= 5) return "4-5 ans";
  if (years <= 9) return "6-9 ans";
  return "10+ ans";
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  try {
    await verifyUserToken(token);
  } catch (e) {
    return NextResponse.json({ error: "Invalid Token" }, { status: 403 });
  }

  // Cache logic could be implemented here using Cache API or just relying on Next.js Cache / Cloudflare Cache.
  // Next.js `fetch` has caching built-in.
  // But here we are fetching from Google API.

  try {
    const GCP_SERVICE_ACCOUNT_EMAIL = process.env.GCP_SERVICE_ACCOUNT_EMAIL;
    const GCP_PRIVATE_KEY = process.env.GCP_PRIVATE_KEY;
    const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

    if (!GCP_SERVICE_ACCOUNT_EMAIL || !GCP_PRIVATE_KEY || !SPREADSHEET_ID) {
      throw new Error("Missing configuration (Secrets).");
    }

    const gToken = await getGoogleAccessToken(
      GCP_SERVICE_ACCOUNT_EMAIL,
      GCP_PRIVATE_KEY
    );

    const sheetName = "Réponses au formulaire 1";
    const googleUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(
      sheetName
    )}`;

    const sheetResponse = await fetch(googleUrl, {
      headers: {
        Authorization: `Bearer ${gToken}`,
      },
      next: { revalidate: 3600 } // Revalidate every hour
    });

    if (!sheetResponse.ok) {
      const err = await sheetResponse.text();
      throw new Error(`Google API Error: ${err}`);
    }

    const rawData = await sheetResponse.json() as any;

    if (!rawData.values || rawData.values.length < 2) {
      throw new Error("No data found in sheet.");
    }

    const headers: string[] = rawData.values[0];
    const rows: string[][] = rawData.values.slice(1);

    const MAPPING: Record<Exclude<keyof SurveyResponse, "xp_group">, string> = {
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
      conseil: "Un conseil, un retour d’expérience, une anecdote ? (facultatif)",
    };

    const headerMap: Record<string, number> = {};
    headers.forEach((h, i) => (headerMap[h] = i));

    const formattedData: SurveyResponse[] = rows.map((row) => {
      const item: any = {};
      for (const [jsonKey, sheetColumnName] of Object.entries(MAPPING)) {
        let colIndex = headerMap[sheetColumnName];

        if (colIndex === undefined) {
          const foundHeader = headers.find((h) => h.includes(sheetColumnName));
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
            if (jsonKey === "annee_diplome" || jsonKey === "experience") {
                item[jsonKey] = 0;
            } else {
                item[jsonKey] = "";
            }
        }
      }

      // Computed field: xp_group
      item.xp_group = calculateXpGroup(item.experience);

      return item as SurveyResponse;
    });

    return NextResponse.json(formattedData, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
