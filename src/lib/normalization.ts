// Logic for converting ranges (e.g., "2-5" -> average) and handling strings like "10+".
export function parseExperience(str: string | undefined): number {
  if (!str) return 0;
  str = String(str).trim();
  if (str.includes("+")) return parseInt(str);

  const parts = str.match(/(\d+)-(\d+)/);
  if (parts) {
    return Math.ceil((parseInt(parts[1]) + parseInt(parts[2])) / 2);
  }
  return parseInt(str) || 0;
}

export function normalizeSector(str: string | undefined): string {
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
    s.includes("gip") || 
    s.includes("doctorat") ||
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
    s.includes("recherche") ||
    s.includes("compagnie") ||
    s.includes("autre") ||
    s.includes("client") ||
    s.includes("free-lance") ||
    s.includes("défense")||
    s.includes("gestion")
  )
    return "Tech / Industrie / Autre";

  return "Autre";
}

export function normalizeJob(str: string | undefined): string {
  if (!str) return "Non renseigné";
  const s = str.toLowerCase();

  if (
    s.includes("product") ||
    s.includes("po")
  )
    return "Product Owner / Product Manager";

  if (
    s.includes("chef de projet") ||
    s.includes("cheffe de projet") ||
    s.includes("projet") ||
    s.includes("agile") ||
    s.includes("scrum")
  )
    return "Chef de Projet";

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

export function normalizeStructure(str: string | undefined): string {
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

export function normalizeRegion(str: string | undefined): string {
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
