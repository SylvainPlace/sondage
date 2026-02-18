import { createHash } from "crypto";
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
import { SurveyResponse } from "@/types";
import { getXpGroup } from "@/lib/xp";
import { parsePrime, parseSalaryRange } from "@/lib/frontend-utils";

const SALARY_CATEGORIES = [
  "Moins de 30k€",
  "30-35k€",
  "35-40k€",
  "40-45k€",
  "45-50k€",
  "50-60k€",
  "60-70k€",
  "70-80k€",
  "80-90k€",
  "90-100k€",
  "Plus de 100k€",
];

const BENEFITS_KEYWORDS = [
  { label: "Télétravail", terms: ["télétravail", "teletravail", "remote"] },
  {
    label: "Tickets Resto",
    terms: ["ticket", "restaurant", "tr", "panier"],
  },
  { label: "Voiture", terms: ["voiture", "véhicule"] },
  { label: "RTT / Congés", terms: ["rtt", "congés", "vacances"] },
  {
    label: "Intéressement",
    terms: ["intéressement", "participation", "interessement"],
  },
  {
    label: "Mutuelle gratuite",
    terms: [
      "mutuelle gratuite",
      "mutuelle pris en charge à 100%",
      "mutuelle prise en charge à 100%",
    ],
  },
];

const FILTER_KEYS: Array<keyof SurveyResponse> = [
  "annee_diplome",
  "sexe",
  "xp_group",
  "poste",
  "secteur",
  "type_structure",
  "departement",
];

function normalizeSalaryLabel(str: string) {
  if (!str) {
    return "";
  }
  return str.toLowerCase().replace(/\s/g, "").replace(/[–—]/g, "-");
}

function normalizeRegionName(name: string) {
  if (!name) {
    return "";
  }
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getStats(values: number[]) {
  if (!values || values.length === 0) {
    return { mean: 0, median: 0 };
  }
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = Math.round(sum / values.length);
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 !== 0
      ? sorted[mid]
      : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  return { mean, median };
}

function getStatsOrNull(values: number[]) {
  if (!values || values.length === 0) {
    return { mean: null, median: null };
  }
  const stats = getStats(values);
  return { mean: stats.mean, median: stats.median };
}

function applyFilters(
  data: SurveyResponse[],
  filters: Record<string, string[]>,
) {
  const entries = Object.entries(filters);
  if (entries.length === 0) {
    return data;
  }

  return data.filter((item) => {
    for (const [key, values] of entries) {
      if (!values || values.length === 0) {
        continue;
      }
      const itemValue = String(item[key as keyof SurveyResponse] ?? "");
      if (!values.some((val) => String(val) === itemValue)) {
        return false;
      }
    }
    return true;
  });
}

function sanitizeFilters(rawFilters: unknown) {
  if (!rawFilters || typeof rawFilters !== "object") {
    return {} as Record<string, string[]>;
  }

  const filters: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(
    rawFilters as Record<string, unknown>,
  )) {
    if (Array.isArray(value)) {
      const cleaned = value
        .map((val) => String(val))
        .map((val) => val.trim())
        .filter((val) => val.length > 0);
      if (cleaned.length > 0) {
        filters[key] = cleaned;
      }
    }
  }
  return filters;
}

function buildEtag(payload: unknown) {
  const hash = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
  return `"${hash}"`;
}

export async function POST(request: NextRequest) {
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

  const body = await request.json().catch(() => ({}));
  const filters = sanitizeFilters((body as { filters?: unknown })?.filters);
  const ifNoneMatch = request.headers.get("if-none-match");

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
      next: { revalidate: 3600 },
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

      item.xp_group = getXpGroup(item.experience);

      return item;
    });

    const filteredData = applyFilters(formattedData, filters);

    const baseValues = filteredData
      .map((d) => parseSalaryRange(d.salaire_brut))
      .filter((val) => val > 0);
    const totalValues = filteredData
      .map((d) => {
        const base = parseSalaryRange(d.salaire_brut);
        if (base === 0) {
          return 0;
        }
        const prime = parsePrime(d.primes);
        return base + prime;
      })
      .filter((val) => val > 0);

    const baseStats = getStats(baseValues);
    const totalStats = getStats(totalValues);

    const stats = {
      mean: baseStats.mean,
      median: baseStats.median,
      meanTotal: totalStats.mean,
      medianTotal: totalStats.median,
      count: filteredData.length,
    };

    const salaryDistribution = {
      labels: SALARY_CATEGORIES,
      counts: SALARY_CATEGORIES.map((cat) => {
        const catClean = normalizeSalaryLabel(cat);
        return filteredData.filter((d) => {
          const dClean = normalizeSalaryLabel(d.salaire_brut);
          return dClean === catClean;
        }).length;
      }),
    };

    const xpMap: Record<number, { base: number[]; total: number[] }> = {};
    let maxXp = 0;

    filteredData.forEach((item) => {
      const xp = Number(item.experience);
      if (!Number.isNaN(xp)) {
        if (xp > maxXp) {
          maxXp = xp;
        }
        if (!xpMap[xp]) {
          xpMap[xp] = { base: [], total: [] };
        }

        const base = parseSalaryRange(item.salaire_brut);
        const prime = parsePrime(item.primes);
        if (base > 0) {
          xpMap[xp].base.push(base);
          xpMap[xp].total.push(base + prime);
        }
      }
    });

    const xpByYear = Array.from({ length: maxXp + 1 }, (_, year) => {
      const group = xpMap[year];
      if (!group) {
        return {
          year,
          meanBase: null,
          medianBase: null,
          meanTotal: null,
          medianTotal: null,
        };
      }
      const baseGroupStats = getStatsOrNull(group.base);
      const totalGroupStats = getStatsOrNull(group.total);
      return {
        year,
        meanBase: baseGroupStats.mean,
        medianBase: baseGroupStats.median,
        meanTotal: totalGroupStats.mean,
        medianTotal: totalGroupStats.median,
      };
    });

    const benefits =
      filteredData.length === 0
        ? []
        : BENEFITS_KEYWORDS.map((k) => {
            const matchCount = filteredData.filter((d) => {
              if (!d.avantages) {
                return false;
              }
              const text = d.avantages.toLowerCase();
              return k.terms.some((term) => text.includes(term));
            }).length;
            return {
              label: k.label,
              percentage: Math.round((matchCount / filteredData.length) * 100),
            };
          }).sort((a, b) => b.percentage - a.percentage);

    const sectorCounts: Record<string, number> = {};
    filteredData.forEach((item) => {
      const sector = item.secteur || "Non renseigné";
      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
    });
    const sectors = Object.entries(sectorCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));

    const regionStats: Record<
      string,
      { salaries: number[]; totals: number[] }
    > = {};
    filteredData.forEach((item) => {
      const region = item.departement;
      if (!region) {
        return;
      }
      const normalizedRegion = normalizeRegionName(region);
      if (!regionStats[normalizedRegion]) {
        regionStats[normalizedRegion] = { salaries: [], totals: [] };
      }

      const salary = parseSalaryRange(item.salaire_brut);
      if (salary > 0) {
        const prime = parsePrime(item.primes);
        regionStats[normalizedRegion].salaries.push(salary);
        regionStats[normalizedRegion].totals.push(salary + prime);
      }
    });

    const mapRegions: Record<
      string,
      {
        avg: number;
        median: number;
        avgTotal: number;
        medianTotal: number;
        count: number;
      }
    > = {};

    for (const key of Object.keys(regionStats)) {
      const group = regionStats[key];
      const baseRegionStats = getStats(group.salaries);
      const totalRegionStats = getStats(group.totals);
      if (group.salaries.length >= 3) {
        mapRegions[key] = {
          avg: baseRegionStats.mean,
          median: baseRegionStats.median,
          avgTotal: totalRegionStats.mean,
          medianTotal: totalRegionStats.median,
          count: group.salaries.length,
        };
      }
    }

    const anecdotes = filteredData
      .filter((item) => item.conseil && item.conseil.trim() !== "")
      .map((item) => ({
        conseil: item.conseil.trim(),
        poste: item.poste,
        secteur: item.secteur,
        experience: item.experience,
      }));

    const filtersResponse: Record<string, { value: string; count: number }[]> =
      {};
    FILTER_KEYS.forEach((key) => {
      const contextFilters = { ...filters };
      delete contextFilters[key];
      const contextData = applyFilters(formattedData, contextFilters);
      const counts: Record<string, number> = {};
      contextData.forEach((item) => {
        const value = String(item[key] ?? "");
        if (!value) {
          return;
        }
        counts[value] = (counts[value] || 0) + 1;
      });
      filtersResponse[key] = Object.entries(counts).map(([value, count]) => ({
        value,
        count,
      }));
    });

    const responsePayload = {
      stats,
      salaryDistribution,
      xpByYear,
      benefits,
      sectors,
      mapRegions,
      anecdotes,
      filters: filtersResponse,
    };
    const etag = buildEtag(responsePayload);

    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          "Cache-Control": "no-store",
          ETag: etag,
        },
      });
    }

    return NextResponse.json(responsePayload, {
      headers: {
        "Cache-Control": "no-store",
        ETag: etag,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
