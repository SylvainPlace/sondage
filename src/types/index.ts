export interface SurveyResponse {
  annee_diplome: number;
  sexe: string;
  departement: string;
  secteur: string;
  type_structure: string;
  poste: string;
  experience: number;
  salaire_brut: string;
  primes: string;
  avantages: string;
  conseil: string;
  xp_group: string; // Virtual field added by frontend
}

export interface UserComparisonData {
  salary: number;
  experience: number;
}

export interface DashboardStats {
  mean: number;
  median: number;
  meanTotal: number;
  medianTotal: number;
  count: number;
}

export interface SalaryDistribution {
  labels: string[];
  counts: number[];
}

export interface XpByYearEntry {
  year: number;
  meanBase: number | null;
  medianBase: number | null;
  meanTotal: number | null;
  medianTotal: number | null;
}

export interface BenefitsStat {
  label: string;
  percentage: number;
}

export interface SectorStat {
  label: string;
  count: number;
}

export interface MapRegionStats {
  avg: number;
  median: number;
  avgTotal: number;
  medianTotal: number;
  count: number;
}

export interface AnecdoteItem {
  conseil: string;
  poste: string;
  secteur: string;
  experience: number;
}

export interface FilterOption {
  value: string;
  count: number;
}

export interface ResultsResponse {
  stats: DashboardStats;
  salaryDistribution: SalaryDistribution;
  xpByYear: XpByYearEntry[];
  benefits: BenefitsStat[];
  sectors: SectorStat[];
  mapRegions: Record<string, MapRegionStats>;
  anecdotes: AnecdoteItem[];
  filters: Record<string, FilterOption[]>;
}
