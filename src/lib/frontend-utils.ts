export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseSalaryRange(rangeStr: string): number {
  if (!rangeStr) return 0;
  const cleanStr = rangeStr
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/[–—]/g, "-")
    .replace("—", "-");

  if (cleanStr.includes("moins")) return 29000;
  if (cleanStr.includes("plus")) return 101000;

  const matches = cleanStr.match(/(\d+)-(\d+)/);
  if (matches) {
    const min = parseInt(matches[1]) * 1000;
    const max = parseInt(matches[2]) * 1000;
    return (min + max) / 2;
  }

  return 0;
}

export function parsePrime(primeStr: string): number {
  if (!primeStr) return 0;
  const cleanStr = primeStr
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/[–—]/g, "-");

  if (cleanStr.includes("aucune") || cleanStr === "0") return 0;
  if (cleanStr.includes("moins")) return 1000;
  if (cleanStr.includes("plus")) return 11000;

  const matches = cleanStr.match(/(\d+)-(\d+)/);
  if (matches) {
    const min = parseInt(matches[1]) * 1000;
    const max = parseInt(matches[2]) * 1000;
    return (min + max) / 2;
  }
  return 0;
}

export { getXpGroup } from "./xp";
