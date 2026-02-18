"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { DashboardStats, ResultsResponse, UserComparisonData } from "@/types";
import { useAuth } from "./AuthContext";

interface DashboardContextType {
  results: ResultsResponse | null;
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
  const [results, setResults] = useState<ResultsResponse | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userComparison, setUserComparison] =
    useState<UserComparisonData | null>(null);

  const fetchResults = useCallback(
    async (filters: Record<string, string[]>) => {
      if (!token) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/results", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ filters }),
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            // Token invalid, let AuthContext handle logout if needed,
            // but here we just throw or handle error
            throw new Error("Session expirée, veuillez vous reconnecter");
          }
          throw new Error("Erreur lors du chargement des données");
        }

        const data = (await res.json()) as ResultsResponse;
        setResults(data);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erreur inconnue";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchResults(activeFilters);
    }
  }, [isAuthenticated, token, activeFilters, fetchResults]);

  const emptyStats: DashboardStats = {
    mean: 0,
    median: 0,
    meanTotal: 0,
    medianTotal: 0,
    count: 0,
  };
  const stats = results?.stats ?? emptyStats;

  const setFilters = (filters: Record<string, string[]>) => {
    setActiveFilters(filters);
  };

  const resetFilters = () => {
    setActiveFilters({});
  };

  return (
    <DashboardContext.Provider
      value={{
        results,
        activeFilters,
        isLoading,
        error,
        stats,
        userComparison,
        setFilters,
        resetFilters,
        setUserComparison,
        refreshData: () => fetchResults(activeFilters),
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
