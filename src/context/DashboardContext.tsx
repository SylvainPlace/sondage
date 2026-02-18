"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
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

const CACHE_TTL_MS = 60 * 60 * 1000;

interface CachedResultsEntry {
  data: ResultsResponse;
  etag: string | null;
  updatedAt: number;
}

function hashString(input: string) {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

function normalizeFilters(filters: Record<string, string[]>) {
  const sortedEntries = Object.entries(filters)
    .map(([key, values]) => [key, [...values].sort()] as const)
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(sortedEntries);
}

function buildCacheKey(filters: Record<string, string[]>, token: string) {
  const userKey = hashString(token);
  const filterKey = hashString(normalizeFilters(filters));
  return `results:${userKey}:${filterKey}`;
}

function readCachedEntry(
  cacheKey: string,
  memoryCache: Record<string, CachedResultsEntry>,
) {
  const memoryEntry = memoryCache[cacheKey];
  if (memoryEntry) {
    return memoryEntry;
  }

  const raw = localStorage.getItem(cacheKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as CachedResultsEntry;
    if (parsed?.data && parsed?.updatedAt) {
      memoryCache[cacheKey] = parsed;
      return parsed;
    }
  } catch {
    localStorage.removeItem(cacheKey);
  }
  return null;
}

function writeCachedEntry(
  cacheKey: string,
  entry: CachedResultsEntry,
  memoryCache: Record<string, CachedResultsEntry>,
) {
  memoryCache[cacheKey] = entry;
  localStorage.setItem(cacheKey, JSON.stringify(entry));
}

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
  const etagRef = useRef<string | null>(null);
  const memoryCacheRef = useRef<Record<string, CachedResultsEntry>>({});

  const fetchResults = useCallback(
    async (filters: Record<string, string[]>) => {
      if (!token) return;
      const cacheKey = buildCacheKey(filters, token);
      const now = Date.now();
      const cachedEntry = readCachedEntry(cacheKey, memoryCacheRef.current);
      const isFresh = cachedEntry && now - cachedEntry.updatedAt < CACHE_TTL_MS;
      if (isFresh) {
        setResults(cachedEntry.data);
        setError(null);
        setIsLoading(false);
      }
      if (!isFresh) {
        setIsLoading(true);
        setError(null);
      }
      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        const etag = cachedEntry?.etag ?? etagRef.current;
        if (etag) {
          headers["If-None-Match"] = etag;
        }
        const res = await fetch("/api/results", {
          method: "POST",
          headers,
          body: JSON.stringify({ filters }),
        });

        if (res.status === 304) {
          const nextEtag = res.headers.get("ETag");
          if (cachedEntry) {
            const refreshedEntry: CachedResultsEntry = {
              ...cachedEntry,
              etag: nextEtag ?? cachedEntry.etag,
              updatedAt: now,
            };
            writeCachedEntry(cacheKey, refreshedEntry, memoryCacheRef.current);
            setResults(refreshedEntry.data);
          }
          if (nextEtag) {
            etagRef.current = nextEtag;
          }
          return;
        }

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            // Token invalid, let AuthContext handle logout if needed,
            // but here we just throw or handle error
            throw new Error("Session expirée, veuillez vous reconnecter");
          }
          throw new Error("Erreur lors du chargement des données");
        }

        const data = (await res.json()) as ResultsResponse;
        const nextEtag = res.headers.get("ETag");
        const entry: CachedResultsEntry = {
          data,
          etag: nextEtag ?? null,
          updatedAt: now,
        };
        writeCachedEntry(cacheKey, entry, memoryCacheRef.current);
        etagRef.current = nextEtag;
        setResults(data);
      } catch (error: unknown) {
        if (!isFresh) {
          const message =
            error instanceof Error ? error.message : "Erreur inconnue";
          setError(message);
        }
      } finally {
        if (!isFresh) {
          setIsLoading(false);
        }
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
