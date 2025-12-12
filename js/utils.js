export function formatMoney(amount) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseSalaryRange(rangeStr) {
  if (!rangeStr) return 0;
  const cleanStr = rangeStr
    .toLowerCase()
    .replace(/o/g, "0")
    .replace(/\s/g, "")
    .replace(/[–—]/g, "-")
    .replace("—", "-");

  if (cleanStr.includes("moinsde30")) return 29000;
  if (cleanStr.includes("plusde100")) return 101000;

  const matches = cleanStr.match(/(\d+)-(\d+)/);
  if (matches) {
    const min = parseInt(matches[1]) * 1000;
    const max = parseInt(matches[2]) * 1000;
    return (min + max) / 2;
  }

  return 0;
}

export function parsePrime(primeStr) {
  if (!primeStr) return 0;
  const cleanStr = primeStr
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/[–—]/g, "-")
    .replace(/o/g, "0");

  if (cleanStr.includes("aucune") || cleanStr === "0") return 0;
  if (cleanStr.includes("moinsde2")) return 1000;
  if (cleanStr.includes("plusde10")) return 11000;

  const matches = cleanStr.match(/(\d+)-(\d+)/);
  if (matches) {
    const min = parseInt(matches[1]) * 1000;
    const max = parseInt(matches[2]) * 1000;
    return (min + max) / 2;
  }
  return 0;
}

export function getXpGroup(years) {
  const xp = parseInt(years);
  if (isNaN(xp)) return "Non renseigné";
  if (xp <= 1) return "0-1 an";
  if (xp <= 3) return "2-3 ans";
  if (xp <= 5) return "4-5 ans";
  if (xp <= 9) return "6-9 ans";
  return "10+ ans";
}
