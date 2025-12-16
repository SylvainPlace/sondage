export function getXpGroup(years: unknown): string {
  const xp = typeof years === "number" ? years : Number.parseInt(String(years), 10);
  if (Number.isNaN(xp)) {return "Non renseigné";}
  if (xp <= 1) {return "0-1 an";}
  if (xp <= 3) {return "2-3 ans";}
  if (xp <= 5) {return "4-5 ans";}
  if (xp <= 9) {return "6-9 ans";}
  return "10+ ans";
}
