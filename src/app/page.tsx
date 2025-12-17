"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";

import {
  SalaryChart,
  XpChart,
  BenefitsList,
  AnecdotesList,
  SectorChart,
} from "@/components/Charts";
import ComparisonForm, {
  UserComparisonData,
} from "@/components/ComparisonForm";
import Filters from "@/components/Filters";
import LoginModal from "@/components/LoginModal";
import { DashboardSkeleton } from "@/components/Skeleton";
import {
  formatMoney,
  parsePrime,
  parseSalaryRange,
} from "@/lib/frontend-utils";
import { SurveyResponse } from "@/lib/types";

// Dynamic import for Map to avoid SSR issues with Leaflet
const Map = dynamic(() => import("@/components/Map"), { ssr: false });

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [allData, setAllData] = useState<SurveyResponse[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const [mapMode, setMapMode] = useState("avg_base");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userComparison, setUserComparison] =
    useState<UserComparisonData | null>(null);

  // Initial Auth Check
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setToken(storedToken);
      fetchData(storedToken);
    } else {
      setIsLoading(false); // Stop loading to show LoginModal (handled by condition !token)
    }

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchData = async (authToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/data", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("auth_token");
          setToken(null);
          return;
        }
        throw new Error("Erreur lors du chargement des données");
      }

      const rawData = (await res.json()) as SurveyResponse[];
      // Add xp_group is now handled by the API
      setAllData(rawData);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (newToken: string) => {
    setToken(newToken);
    fetchData(newToken);
  };

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

  // Calculate Stats
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

  if (isLoading) {
    return (
      <div className="container">
        <header>
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
          <p>Bienvenue sur le Panorama des Carrières...</p>
        </header>
        <DashboardSkeleton />
      </div>
    );
  }

  if (!token) {
    return <LoginModal onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="container">
      <header>
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
          className="cta-button"
        >
          Participer au sondage
        </a>
      </header>

      <main className="main-grid">
        <div>
          <ComparisonForm onCompare={setUserComparison} />
          <Filters
            data={allData}
            activeFilters={activeFilters}
            onChange={setActiveFilters}
            onReset={() => setActiveFilters({})}
          />
        </div>

        <section className="results-panel">
          {isLoading ? (
            <DashboardSkeleton />
          ) : error ? (
            <div style={{ color: "red", textAlign: "center", padding: "3rem" }}>
              <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</p>
              <p>Impossible de charger les données.</p>
              <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
                {error}
              </p>
            </div>
          ) : stats.count === 0 ? (
            <div
              id="no-results"
              style={{ textAlign: "center", padding: "3rem" }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
              <h3>Aucun résultat trouvé</h3>
              <p style={{ color: "var(--text-muted)" }}>
                Essayez de modifier vos filtres pour élargir la recherche.
              </p>
            </div>
          ) : (
            <div id="results-content">
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Salaire Moyen</h3>
                  <div className="value">
                    {stats.count > 0 ? formatMoney(stats.mean) : "- €"}
                  </div>
                  <div className="subtitle">Brut annuel hors primes</div>
                </div>
                <div className="stat-card">
                  <h3>Salaire Médian</h3>
                  <div className="value">
                    {stats.count > 0 ? formatMoney(stats.median) : "- €"}
                  </div>
                  <div className="subtitle">Brut annuel hors primes</div>
                </div>
                <div className="stat-card">
                  <h3>Moyen (+ Primes)</h3>
                  <div className="value">
                    {stats.count > 0 ? formatMoney(stats.meanTotal) : "- €"}
                  </div>
                  <div className="subtitle">Brut annuel avec primes</div>
                </div>
                <div className="stat-card">
                  <h3>Médian (+ Primes)</h3>
                  <div className="value">
                    {stats.count > 0 ? formatMoney(stats.medianTotal) : "- €"}
                  </div>
                  <div className="subtitle">Brut annuel avec primes</div>
                </div>
                <div className="stat-card">
                  <h3>Répondants</h3>
                  <div className="value">{stats.count}</div>
                  <div className="subtitle">Profils sélectionnés</div>
                </div>
              </div>

              <div className="charts-section">
                <h2>Distribution des Salaires</h2>
                <div className="chart-container">
                  <SalaryChart
                    data={filteredData}
                    userComparison={userComparison}
                  />
                </div>
              </div>

              <div className="charts-section">
                <h2>Salaire Moyen par Expérience</h2>
                <div className="chart-container">
                  <XpChart
                    data={filteredData}
                    userComparison={userComparison}
                  />
                </div>
              </div>

              <div className="benefits-section">
                <h2>Avantages les plus fréquents</h2>
                <BenefitsList data={filteredData} />
              </div>

              <div className="charts-section">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <h2>Répartition Géographique</h2>
                  <div className="map-controls">
                    <label
                      htmlFor="map-mode"
                      style={{
                        marginRight: "10px",
                        fontWeight: 500,
                        fontSize: "0.875rem",
                      }}
                    >
                      Afficher :
                    </label>
                    <select
                      id="map-mode"
                      name="mapMode"
                      value={mapMode}
                      onChange={(e) => setMapMode(e.target.value)}
                      className="dropdown-btn"
                      style={{ width: "auto", display: "inline-block" }}
                    >
                      <option value="avg_base">Salaire Moyen</option>
                      <option value="median_base">Salaire Médian</option>
                      <option value="avg_total">Moyen (+ Primes)</option>
                      <option value="median_total">Médian (+ Primes)</option>
                      <option value="count">Nombre de répondants</option>
                    </select>
                  </div>
                </div>
                <div className="chart-container" style={{ height: "500px" }}>
                  <Map data={filteredData} mode={mapMode} />
                </div>
              </div>

              <div className="charts-section">
                <h2>Repartition par Secteur</h2>
                <div className="chart-container" style={{ height: "350px" }}>
                  <SectorChart data={filteredData} />
                </div>
              </div>

              <div className="anecdotes-section">
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
        className={`scroll-top ${showScrollTop ? "visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Remonter en haut"
      >
        ↑
      </button>

      <footer className="credits-section">
        <div className="credits-content">
          <p>
            Tu veux aider ? Contacte un admin ou{" "}
            <a
              href="https://github.com/SylvainPlace/sondage"
              target="_blank"
              rel="noopener noreferrer"
              className="credits-link"
            >
              plonge-toi dans le code 🡢
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
