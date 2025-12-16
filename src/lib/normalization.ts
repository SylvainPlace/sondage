// Logic for converting ranges (e.g., "2-5" -> average) and handling strings like "10+".
export function parseExperience(str: string | undefined): number {
  if (!str) {
    return 0;
  }
  str = String(str).trim();
  if (str.includes("+")) {
    return parseInt(str);
  }

  const parts = str.match(/(\d+)-(\d+)/);
  if (parts) {
    return Math.ceil((parseInt(parts[1]) + parseInt(parts[2])) / 2);
  }
  return parseInt(str) || 0;
}

// Data-driven configuration for normalization

interface NormalizationRule {
  label: string;
  keywords: string[];
}

const SECTOR_RULES: NormalizationRule[] = [
  {
    label: "Éditeur Logiciel Santé",
    keywords: ["logiciel santé", "logiciel médical"],
  },
  {
    label: "Structure de Soins",
    keywords: [
      "établissement de santé",
      "médico-social",
      "hôpital",
      "clinique",
      "laboratoire",
      "soins",
    ],
  },
  {
    label: "Institution Publique",
    keywords: [
      "public",
      "ars",
      "ans",
      "ministère",
      "gip",
      "doctorat",
      "recherche",
    ],
  },
  {
    label: "ESN / Conseil",
    keywords: ["esn", "conseil", "freelance", "client"],
  },
  {
    label: "Industrie Santé",
    keywords: ["pharma", "medtech", "biotech", "dispositif médical"],
  },
  {
    label: "Banque / Assurance",
    keywords: ["banque", "bancaire", "assurance", "insurtech", "finance"],
  },
  {
    label: "Éditeur Logiciel (Autre)",
    keywords: ["éditeur", "logiciel", "saas", "platform"],
  },
  {
    label: "Tech / Industrie / Autre",
    keywords: [
      "tech",
      "startup",
      "industrie",
      "télécom",
      "sécurité",
      "security",
      "recherche",
      "compagnie",
      "autre",
      "client",
      "free-lance",
      "défense",
      "gestion",
    ],
  },
];

const JOB_RULES: NormalizationRule[] = [
  {
    label: "Product Owner / Product Manager",
    keywords: ["product", "po"],
  },
  {
    label: "Chef de Projet",
    keywords: [
      "chef de projet",
      "cheffe de projet",
      "projet",
      "agile",
      "scrum",
    ],
  },
  {
    label: "Développeur / Ingénieur",
    keywords: [
      "développeur",
      "développeuse",
      "dev",
      "software",
      "ingénieur logiciel",
      "programmer",
      "java",
      "web",
    ],
  },
  {
    label: "Tech Lead / Architecte",
    keywords: ["tech lead", "lead", "architecte", "principal"],
  },
  {
    label: "Data / BI",
    keywords: ["data", "bi ", "business analyst", " bi"], // Note: " bi" suffix handled via endsWith logic in loop if needed, but simple contains works for most
  },
  {
    label: "DevOps / Infra / Sécurité",
    keywords: [
      "devops",
      "système",
      "réseau",
      "sécurité",
      "admin",
      "cloud",
      "sre",
      "cyber",
    ],
  },
  {
    label: "Consultant / Intégrateur",
    keywords: ["consultant", "intégrateur", "intératrice", "support"],
  },
  {
    label: "Manager / Directeur",
    keywords: ["manager", "directeur", "responsable", "head of"],
  },
  {
    label: "Recherche / R&D",
    keywords: ["recherche", "r&d", "doctorant", "thèse"],
  },
];

const STRUCTURE_RULES: NormalizationRule[] = [
  { label: "Start-up", keywords: ["start-up", "startup", "scale"] },
  { label: "PME", keywords: ["pme"] },
  { label: "ETI", keywords: ["eti"] },
  { label: "Grand groupe", keywords: ["grand groupe", "entreprise"] },
  {
    label: "Administration publique",
    keywords: [
      "public",
      "administration",
      "gip",
      "groupement",
      "université",
      "recherche",
      "numih",
      "hôpital",
    ],
  },
  {
    label: "Freelance / Indépendant",
    keywords: ["freelance", "indépendant"],
  },
];

const REGION_RULES: NormalizationRule[] = [
  { label: "Full Télétravail", keywords: ["télétravail"] },
  {
    label: "International",
    keywords: [
      "autre pays",
      "monaco",
      "suisse",
      "luxembourg",
      "belgique",
      "royaume-uni",
      "allemagne",
      "canada",
    ],
  },
  {
    label: "Occitanie",
    keywords: [
      "haute-garonne",
      "31",
      "tarn",
      "81",
      "ariège",
      "09",
      "gers",
      "32",
      "hérault",
      "34",
      "lot",
      "46",
      "hautes-pyrenées",
      "65",
      "pyrenées-orientales",
      "66",
      "tarn-et-garonne",
      "82",
      "aveyron",
      "12",
      "lozère",
      "48",
      "aude",
      "11",
      "gard",
      "30",
    ],
  },
  {
    label: "Île-de-France",
    keywords: [
      "paris",
      "75",
      "hauts-de-seine",
      "92",
      "seine-saint-denis",
      "93",
      "val-de-marne",
      "94",
      "seine-et-marne",
      "77",
      "yvelines",
      "78",
      "essonne",
      "91",
      "val-d'oise",
      "95",
    ],
  },
  {
    label: "Nouvelle-Aquitaine",
    keywords: [
      "gironde",
      "33",
      "haute-vienne",
      "87",
      "pyrénées-atlantiques",
      "64",
      "landes",
      "40",
      "dordogne",
      "24",
      "lot-et-garonne",
      "47",
    ],
  },
  {
    label: "Auvergne-Rhône-Alpes",
    keywords: [
      "rhône",
      "69",
      "puy-de-dôme",
      "63",
      "isère",
      "38",
      "ain",
      "01",
      "loire",
      "42",
      "savoie",
      "73",
      "74",
    ],
  },
  {
    label: "Bretagne",
    keywords: [
      "finistère",
      "29",
      "morbihan",
      "56",
      "ille-et-vilaine",
      "35",
      "côtes-d'armor",
      "22",
    ],
  },
  {
    label: "Pays de la Loire",
    keywords: [
      "loire-atlantique",
      "44",
      "maine-et-loire",
      "49",
      "mayenne",
      "53",
      "sarthe",
      "72",
      "vendée",
      "85",
    ],
  },
  {
    label: "PACA / Sud",
    keywords: [
      "bouches-du-rhône",
      "13",
      "var",
      "83",
      "alpes-maritimes",
      "06",
      "vaucluse",
      "84",
    ],
  },
  {
    label: "Grand Est",
    keywords: [
      "bas-rhin",
      "67",
      "haut-rhin",
      "68",
      "moselle",
      "57",
      "meurthe-et-moselle",
      "54",
    ],
  },
  {
    label: "Centre-Val de Loire",
    keywords: ["indre-et-loire", "37", "loiret", "45"],
  },
  {
    label: "DOM-TOM",
    keywords: [
      "réunion",
      "974",
      "polynésie",
      "987",
      "guadeloupe",
      "971",
      "martinique",
      "972",
      "guyane",
      "973",
    ],
  },
];

function normalizeWithRules(
  str: string | undefined,
  rules: NormalizationRule[],
  defaultLabel: string = "Autre",
): string {
  if (!str) {
    return "Non renseigné";
  }
  const s = str.toLowerCase().trim();

  for (const rule of rules) {
    if (
      rule.keywords.some(
        (k) => s.includes(k) || (k.startsWith(" ") && s.endsWith(k.trim())),
      )
    ) {
      // Handle " endsWith" via space prefix hack or explicit check
      return rule.label;
    }
  }

  return defaultLabel;
}

// Specialized wrapper for regions to handle specific default
function normalizeRegionWithRules(str: string | undefined): string {
  return normalizeWithRules(str, REGION_RULES, "Autre Région");
}

export function normalizeSector(str: string | undefined): string {
  return normalizeWithRules(str, SECTOR_RULES);
}

export function normalizeJob(str: string | undefined): string {
  // Special handling for edge cases if needed, but generic engine covers most
  // The original code had s.endsWith(" bi") for one case, we can handle via includes(" bi") usually
  // or simple logic. Our generic engine uses includes.
  return normalizeWithRules(str, JOB_RULES);
}

export function normalizeStructure(str: string | undefined): string {
  return normalizeWithRules(str, STRUCTURE_RULES);
}

export function normalizeRegion(str: string | undefined): string {
  return normalizeRegionWithRules(str);
}
