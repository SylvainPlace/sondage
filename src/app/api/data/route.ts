import { NextRequest, NextResponse } from "next/server";

import { getGoogleAccessToken } from "@/lib/google-auth";
import { verifyUserToken } from "@/lib/jwt";
import {
  parseExperience,
  normalizeSector,
  normalizeStructure,
  normalizeJob,
  normalizeRegion,
} from "@/lib/normalization";
import { SurveyResponse } from "@/lib/types";
import { getXpGroup } from "@/lib/xp";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  try {
    await verifyUserToken(token);
  } catch {
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
      GCP_PRIVATE_KEY,
    );

    const sheetName = "Réponses au formulaire 1";
    const googleUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(
      sheetName,
    )}`;

    const sheetResponse = await fetch(googleUrl, {
      headers: {
        Authorization: `Bearer ${gToken}`,
      },
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!sheetResponse.ok) {
      const err = await sheetResponse.text();
      throw new Error(`Google API Error: ${err}`);
    }

    const rawData = (await sheetResponse.json()) as { values?: string[][] };

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
      conseil:
        "Un conseil, un retour d’expérience, une anecdote ? (facultatif)",
    };

    const headerMap: Record<string, number> = {};
    headers.forEach((h, i) => (headerMap[h] = i));

    const formattedData: SurveyResponse[] = rows.map((row) => {
      const item: SurveyResponse = {
        annee_diplome: 0,
        sexe: "",
        departement: "",
        secteur: "",
        type_structure: "",
        poste: "",
        experience: 0,
        salaire_brut: "",
        primes: "",
        avantages: "",
        conseil: "",
        xp_group: "Non renseigné",
      };

      for (const [jsonKey, sheetColumnName] of Object.entries(MAPPING)) {
        let colIndex = headerMap[sheetColumnName];

        if (colIndex === undefined) {
          const foundHeader = headers.find((h) => h.includes(sheetColumnName));
          if (foundHeader) {
            colIndex = headerMap[foundHeader];
          }
        }

        if (colIndex === undefined || row[colIndex] === undefined) {
          continue;
        }

        const value = row[colIndex];
        switch (jsonKey) {
          case "experience":
            item.experience = parseExperience(value);
            break;
          case "annee_diplome": {
            const num = parseInt(value, 10);
            item.annee_diplome = Number.isNaN(num) ? 0 : num;
            break;
          }
          case "secteur":
            item.secteur = normalizeSector(value);
            break;
          case "type_structure":
            item.type_structure = normalizeStructure(value);
            break;
          case "poste":
            item.poste = normalizeJob(value);
            break;
          case "departement":
            item.departement = normalizeRegion(value);
            break;
          case "sexe":
            item.sexe = String(value).trim();
            break;
          case "salaire_brut":
            item.salaire_brut = String(value).trim();
            break;
          case "primes":
            item.primes = String(value).trim();
            break;
          case "avantages":
            item.avantages = String(value).trim();
            break;
          case "conseil":
            item.conseil = String(value).trim();
            break;
        }
      }

      // Computed field: xp_group
      item.xp_group = getXpGroup(item.experience);

      return item;
    });

    return NextResponse.json(formattedData, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
