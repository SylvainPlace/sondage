"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, useEffect, useCallback, memo } from "react";

import { useAuth } from "@/context/AuthContext";
import { useDashboard } from "@/context/DashboardContext";
import { DashboardSkeleton, ResultsSkeleton } from "@/components/ui/Skeleton";
import LoginModal from "@/features/auth/LoginModal";
import Filters from "@/features/filters/Filters";
import ComparisonForm from "@/features/dashboard/ComparisonForm";
import IdeaBox from "@/features/ideas/IdeaBox";
import { formatMoney } from "@/lib/frontend-utils";
import { Button } from "@/components/ui/Button";

import { SalaryChart } from "@/features/charts/SalaryChart";
import { XpChart } from "@/features/charts/XpChart";
import { BenefitsList } from "@/features/charts/BenefitsList";
import { AnecdotesList } from "@/features/charts/AnecdotesList";
import { SectorChart } from "@/features/charts/SectorChart";
import { Card } from "@/components/ui/Card";
import type { DashboardStats, ResultsResponse, UserComparisonData } from "@/types";
import styles from "./Dashboard.module.css";

// Dynamic import for Map
const Map = dynamic(() => import("@/features/map/Map"), { ssr: false });

interface StatsGridProps {
  stats: DashboardStats;
  userComparison: UserComparisonData | null;
}

const StatsGrid = memo(function StatsGrid({ stats, userComparison }: StatsGridProps) {
  const renderComparison = useCallback(
    (statValue: number) => {
      if (!userComparison || !userComparison.salary || !statValue) return null;
      const diff = userComparison.salary - statValue;
      const percent = Math.round((diff / statValue) * 100);
      const isPositive = diff >= 0;
      const sign = isPositive ? "+" : "";

      return (
        <div
          className={`${styles.comparison} ${isPositive ? styles.comparisonPositive : styles.comparisonNegative}`}
        >
          {sign}
          {formatMoney(diff)} ({sign}
          {percent}%)
        </div>
      );
    },
    [userComparison],
  );

  return (
    <div className={styles.statsGrid}>
      <Card title="Salaire Moyen" subtitle="Brut annuel hors primes" className={styles.statCard}>
        <div className={styles.statValue}>{stats.count > 0 ? formatMoney(stats.mean) : "- €"}</div>
        {stats.count > 0 && renderComparison(stats.mean)}
      </Card>
      <Card title="Salaire Médian" subtitle="Brut annuel hors primes" className={styles.statCard}>
        <div className={styles.statValue}>
          {stats.count > 0 ? formatMoney(stats.median) : "- €"}
        </div>
        {stats.count > 0 && renderComparison(stats.median)}
      </Card>
      <Card title="Moyen (+ Primes)" subtitle="Brut annuel avec primes" className={styles.statCard}>
        <div className={styles.statValue}>
          {stats.count > 0 ? formatMoney(stats.meanTotal) : "- €"}
        </div>
        {stats.count > 0 && renderComparison(stats.meanTotal)}
      </Card>
      <Card
        title="Médian (+ Primes)"
        subtitle="Brut annuel avec primes"
        className={styles.statCard}
      >
        <div className={styles.statValue}>
          {stats.count > 0 ? formatMoney(stats.medianTotal) : "- €"}
        </div>
        {stats.count > 0 && renderComparison(stats.medianTotal)}
      </Card>
      <Card title="Répondants" subtitle="Profils sélectionnés" className={styles.statCard}>
        <div className={styles.statValue}>{stats.count}</div>
      </Card>
    </div>
  );
});

interface ResultsPanelProps {
  isLoading: boolean;
  error: string | null;
  stats: DashboardStats;
  results: ResultsResponse | null;
  userComparison: UserComparisonData | null;
  hasActiveFilters: boolean;
  logout: () => void;
  mapMode: string;
  onMapModeChange: (value: string) => void;
}

const ResultsPanel = memo(function ResultsPanel({
  isLoading,
  error,
  stats,
  results,
  userComparison,
  hasActiveFilters,
  logout,
  mapMode,
  onMapModeChange,
}: ResultsPanelProps) {
  if (isLoading) {
    return <ResultsSkeleton />;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorIcon}>⚠️</p>
        <p>Impossible de charger les données.</p>
        <p className={styles.errorText}>{error}</p>
        <Button onClick={logout} variant="primary" style={{ marginTop: "1rem" }}>
          Se reconnecter
        </Button>
      </div>
    );
  }

  if (stats.count === 0) {
    return (
      <div id="no-results" className={styles.noResults}>
        <div className={styles.noResultsIcon}>🔍</div>
        <h3>Aucun résultat trouvé</h3>
        <p className={styles.noResultsText}>
          Essayez de modifier vos filtres pour élargir la recherche.
        </p>
      </div>
    );
  }

  return (
    <div id="results-content">
      <StatsGrid stats={stats} userComparison={userComparison} />

      <div className={styles.chartsSection}>
        <h2>Distribution des Salaires</h2>
        <div className={styles.chartContainer}>
          <SalaryChart distribution={results?.salaryDistribution} userComparison={userComparison} />
        </div>
      </div>

      <div className={styles.chartsSection}>
        <h2>Salaire Moyen par Expérience</h2>
        <div className={styles.chartContainer}>
          <XpChart data={results?.xpByYear ?? []} userComparison={userComparison} />
        </div>
      </div>

      <div className={styles.chartsSection}>
        <h2>Avantages les plus fréquents</h2>
        <BenefitsList data={results?.benefits ?? []} />
      </div>

      <div className={styles.chartsSection}>
        <div className={styles.mapHeader}>
          <h2>Répartition Géographique</h2>
          <div className={styles.mapControls}>
            <label htmlFor="map-mode" className={styles.mapLabel}>
              Afficher :
            </label>
            <select
              id="map-mode"
              name="mapMode"
              value={mapMode}
              onChange={(e) => onMapModeChange(e.target.value)}
              className={styles.mapDropdown}
            >
              <option value="avg_base">Salaire Moyen</option>
              <option value="median_base">Salaire Médian</option>
              <option value="avg_total">Moyen (+ Primes)</option>
              <option value="median_total">Médian (+ Primes)</option>
              <option value="count">Nombre de répondants</option>
            </select>
          </div>
        </div>
        <div className={styles.chartContainer} style={{ height: "600px" }}>
          <Map regions={results?.mapRegions ?? {}} mode={mapMode} />
        </div>
      </div>

      <div className={styles.chartsSection}>
        <h2>Repartition par Secteur</h2>
        <div className={styles.chartContainer} style={{ height: "400px" }}>
          <SectorChart data={results?.sectors ?? []} />
        </div>
      </div>

      <div className={styles.chartsSection}>
        <h2>Conseils & Retours d&apos;expérience</h2>
        <AnecdotesList data={results?.anecdotes ?? []} hasActiveFilters={hasActiveFilters} />
      </div>
    </div>
  );
});

export default function Dashboard() {
  const { isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const {
    results,
    isLoading: isDataLoading,
    error,
    stats,
    userComparison,
    activeFilters,
  } = useDashboard();

  const [mapMode, setMapMode] = useState("avg_base");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mounted, setMounted] = useState(false);

  const handleMapModeChange = useCallback((value: string) => {
    setMapMode(value);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Mark component as mounted to avoid hydration mismatch
    setMounted(true);
  }, []);

  if (isAuthLoading) {
    return <DashboardSkeleton />;
  }

  // Use a loading state to avoid hydration mismatch
  if (!mounted) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated) {
    return <LoginModal />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.dashboardHeader}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            marginBottom: "0.5rem",
          }}
        >
          <Image src="/logo.webp" alt="Logo" width={60} height={40} />
          <h1>Panorama des Carrières Alumnis</h1>
        </div>
        <p>
          Bienvenue sur le Panorama des Carrières, fruit de la grande enquête annuelle menée auprès
          des membres de notre association. Cet outil interactif a été conçu pour vous offrir une
          transparence totale sur le marché de l&apos;emploi au sein de notre communauté.
        </p>
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSdnh6qcQjVctVYsgcjOOlVwCO_4PtFGHSzmZ7lP0f6rw3krWA/viewform"
          target="_blank"
          className={styles.ctaButton}
        >
          Participer au sondage
        </a>
      </header>

      <div className={styles.floatingIdeaBox}>
        <IdeaBox />
      </div>

      <main className={styles.mainGrid}>
        <div className={styles.filtersColumn}>
          <ComparisonForm />
          <Filters />
        </div>

        <section className="results-panel">
          <ResultsPanel
            isLoading={isDataLoading}
            error={error}
            stats={stats}
            results={results}
            userComparison={userComparison}
            hasActiveFilters={Object.keys(activeFilters).length > 0}
            logout={logout}
            mapMode={mapMode}
            onMapModeChange={handleMapModeChange}
          />
        </section>
      </main>

      <button
        className={`${styles.scrollTop} ${showScrollTop ? styles.visible : ""}`}
        onClick={scrollToTop}
        aria-label="Remonter en haut"
      >
        ↑
      </button>

      <footer className={styles.creditsSection}>
        <div className={styles.creditsContent}>
          <p>
            Tu veux aider ? Contacte un admin ou{" "}
            <a
              href="https://github.com/SylvainPlace/sondage"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.creditsLink}
            >
              plonge-toi dans le code 🡢
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
