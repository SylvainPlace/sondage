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

export type SurveyData = SurveyResponse[];

export interface UserComparisonData {
  salary: number;
  experience: number;
}
