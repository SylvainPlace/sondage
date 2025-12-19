"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import { SurveyResponse, UserComparisonData } from "@/types";
import { parseSalaryRange, parsePrime } from "@/lib/frontend-utils";
import { useAuth } from "./AuthContext";

interface DashboardStats {
  mean: number;
  median: number;
  meanTotal: number;
  medianTotal: number;
  count: number;
}

interface DashboardContextType {
  allData: SurveyResponse[];
  filteredData: SurveyResponse[];
  activeFilters: Record<string, string[]>;
  isLoading: boolean;
  error: string | null;
  stats: DashboardStats;
  userComparison: UserComparisonData | null;
  setFilters: (filters: Record<string, string[]>) => void;
  resetFilters: () => void;
  setUserComparison: (data: UserComparisonData | null) => void;
  refreshData: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined,
);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [allData, setAllData] = useState<SurveyResponse[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userComparison, setUserComparison] =
    useState<UserComparisonData | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/data", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          // Token invalid, let AuthContext handle logout if needed,
          // but here we just throw or handle error
          throw new Error("Session expirée, veuillez vous reconnecter");
        }
        throw new Error("Erreur lors du chargement des données");
      }

      const rawData = (await res.json()) as SurveyResponse[];
      setAllData(rawData);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchData();
    }
  }, [isAuthenticated, token, fetchData]);

  const filteredData = useMemo(() => {
    if (Object.keys(activeFilters).length === 0) {
      return allData;
    }

    return allData.filter((item) => {
      for (const key in activeFilters) {
        const filterValues = activeFilters[key];
        const itemValue = String(item[key as keyof SurveyResponse]);
        if (!filterValues.some((val) => String(val) === itemValue)) {
          return false;
        }
      }
      return true;
    });
  }, [allData, activeFilters]);

  const stats = useMemo(() => {
    const salairesNumeriques = filteredData
      .map((d) => parseSalaryRange(d.salaire_brut))
      .filter((val) => val > 0)
      .sort((a, b) => a - b);

    const salairesTotaux = filteredData
      .map((d) => {
        const base = parseSalaryRange(d.salaire_brut);
        if (base === 0) {
          return 0;
        }
        const prime = parsePrime(d.primes);
        return base + prime;
      })
      .filter((val) => val > 0)
      .sort((a, b) => a - b);

    let mean = 0,
      median = 0,
      meanTotal = 0,
      medianTotal = 0;

    if (salairesNumeriques.length > 0) {
      const sum = salairesNumeriques.reduce((acc, val) => acc + val, 0);
      mean = Math.round(sum / salairesNumeriques.length);
      const mid = Math.floor(salairesNumeriques.length / 2);
      median =
        salairesNumeriques.length % 2 !== 0
          ? salairesNumeriques[mid]
          : Math.round(
              (salairesNumeriques[mid - 1] + salairesNumeriques[mid]) / 2,
            );
    }

    if (salairesTotaux.length > 0) {
      const sum = salairesTotaux.reduce((acc, val) => acc + val, 0);
      meanTotal = Math.round(sum / salairesTotaux.length);
      const mid = Math.floor(salairesTotaux.length / 2);
      medianTotal =
        salairesTotaux.length % 2 !== 0
          ? salairesTotaux[mid]
          : Math.round((salairesTotaux[mid - 1] + salairesTotaux[mid]) / 2);
    }

    return { mean, median, meanTotal, medianTotal, count: filteredData.length };
  }, [filteredData]);

  const setFilters = (filters: Record<string, string[]>) => {
    setActiveFilters(filters);
  };

  const resetFilters = () => {
    setActiveFilters({});
  };

  return (
    <DashboardContext.Provider
      value={{
        allData,
        filteredData,
        activeFilters,
        isLoading,
        error,
        stats,
        userComparison,
        setFilters,
        resetFilters,
        setUserComparison,
        refreshData: fetchData,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
