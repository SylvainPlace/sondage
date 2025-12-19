"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, useEffect } from "react";

import { useAuth } from "@/context/AuthContext";
import { useDashboard } from "@/context/DashboardContext";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import LoginModal from "@/features/auth/LoginModal";
import Filters from "@/features/filters/Filters";
import ComparisonForm from "@/features/dashboard/ComparisonForm";
import { formatMoney } from "@/lib/frontend-utils";

import { SalaryChart } from "@/features/charts/SalaryChart";
import { XpChart } from "@/features/charts/XpChart";
import { BenefitsList } from "@/features/charts/BenefitsList";
import { AnecdotesList } from "@/features/charts/AnecdotesList";
import { SectorChart } from "@/features/charts/SectorChart";
import { Card } from "@/components/ui/Card";
import styles from "./Dashboard.module.css";

// Dynamic import for Map
const Map = dynamic(() => import("@/features/map/Map"), { ssr: false });

export default function Dashboard() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const {
    filteredData,
    isLoading: isDataLoading,
    error,
    stats,
    userComparison,
    activeFilters,
  } = useDashboard();

  const [mapMode, setMapMode] = useState("avg_base");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mounted, setMounted] = useState(false);

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
          Bienvenue sur le Panorama des Carrières, fruit de la grande enquête
          annuelle menée auprès des membres de notre association. Cet outil
          interactif a été conçu pour vous offrir une transparence totale sur le
          marché de l&apos;emploi au sein de notre communauté.
        </p>
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSdnh6qcQjVctVYsgcjOOlVwCO_4PtFGHSzmZ7lP0f6rw3krWA/viewform"
          target="_blank"
          className={styles.ctaButton}
        >
          Participer au sondage
        </a>
      </header>

      <main className={styles.mainGrid}>
        <div className={styles.filtersColumn}>
          <ComparisonForm />
          <Filters />
        </div>

        <section className="results-panel">
          {isDataLoading ? (
            <DashboardSkeleton />
          ) : error ? (
            <div className={styles.errorContainer}>
              <p className={styles.errorIcon}>⚠️</p>
              <p>Impossible de charger les données.</p>
              <p className={styles.errorText}>{error}</p>
            </div>
          ) : stats.count === 0 ? (
            <div id="no-results" className={styles.noResults}>
              <div className={styles.noResultsIcon}>🔍</div>
              <h3>Aucun résultat trouvé</h3>
              <p className={styles.noResultsText}>
                Essayez de modifier vos filtres pour élargir la recherche.
              </p>
            </div>
          ) : (
            <div id="results-content">
              <div className={styles.statsGrid}>
                <Card
                  title="Salaire Moyen"
                  subtitle="Brut annuel hors primes"
                  className={styles.statCard}
                >
                  <div className={styles.statValue}>
                    {stats.count > 0 ? formatMoney(stats.mean) : "- €"}
                  </div>
                </Card>
                <Card
                  title="Salaire Médian"
                  subtitle="Brut annuel hors primes"
                  className={styles.statCard}
                >
                  <div className={styles.statValue}>
                    {stats.count > 0 ? formatMoney(stats.median) : "- €"}
                  </div>
                </Card>
                <Card
                  title="Moyen (+ Primes)"
                  subtitle="Brut annuel avec primes"
                  className={styles.statCard}
                >
                  <div className={styles.statValue}>
                    {stats.count > 0 ? formatMoney(stats.meanTotal) : "- €"}
                  </div>
                </Card>
                <Card
                  title="Médian (+ Primes)"
                  subtitle="Brut annuel avec primes"
                  className={styles.statCard}
                >
                  <div className={styles.statValue}>
                    {stats.count > 0 ? formatMoney(stats.medianTotal) : "- €"}
                  </div>
                </Card>
                <Card
                  title="Répondants"
                  subtitle="Profils sélectionnés"
                  className={styles.statCard}
                >
                  <div className={styles.statValue}>{stats.count}</div>
                </Card>
              </div>

              <div className={styles.chartsSection}>
                <h2>Distribution des Salaires</h2>
                <div className={styles.chartContainer}>
                  <SalaryChart
                    data={filteredData}
                    userComparison={userComparison}
                  />
                </div>
              </div>

              <div className={styles.chartsSection}>
                <h2>Salaire Moyen par Expérience</h2>
                <div className={styles.chartContainer}>
                  <XpChart
                    data={filteredData}
                    userComparison={userComparison}
                  />
                </div>
              </div>

              <div className={styles.chartsSection}>
                <h2>Avantages les plus fréquents</h2>
                <BenefitsList data={filteredData} />
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
                      onChange={(e) => setMapMode(e.target.value)}
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
                <div
                  className={styles.chartContainer}
                  style={{ height: "600px" }}
                >
                  <Map data={filteredData} mode={mapMode} />
                </div>
              </div>

              <div className={styles.chartsSection}>
                <h2>Repartition par Secteur</h2>
                <div
                  className={styles.chartContainer}
                  style={{ height: "400px" }}
                >
                  <SectorChart data={filteredData} />
                </div>
              </div>

              <div className={styles.chartsSection}>
                <h2>Conseils & Retours d&apos;expérience</h2>
                <AnecdotesList
                  data={filteredData}
                  hasActiveFilters={Object.keys(activeFilters).length > 0}
                />
              </div>
            </div>
          )}
        </section>
      </main>

      <button
        className={`${styles.scrollTop} ${showScrollTop ? styles.visible : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
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
