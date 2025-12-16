"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler,
  type ChartDataset,
  type ScriptableContext,
  type TooltipItem,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { parsePrime, parseSalaryRange } from "@/lib/frontend-utils";
import { useMemo } from "react";
import { SurveyResponse } from "@/lib/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler
);

import { UserComparisonData } from "./ComparisonForm";

interface ChartsProps {
  data: SurveyResponse[];
  userComparison?: UserComparisonData | null;
}

export function SalaryChart({ data, userComparison }: ChartsProps) {
  const chartData = useMemo(() => {
    const categories = [
      "Moins de 30k€",
      "30-35k€",
      "35-40k€",
      "40-45k€",
      "45-50k€",
      "50-60k€",
      "60-70k€",
      "70-80k€",
      "80-90k€",
      "90-100k€",
      "Plus de 100k€",
    ];

    const counts = categories.map((cat) => {
      return data.filter((d) => {
        const normalize = (str: string) => {
          if (!str) return "";
          return str.toLowerCase().replace(/\s/g, "").replace(/[–—]/g, "-");
        };

        const dClean = normalize(d.salaire_brut);
        const catClean = normalize(cat);

        return dClean === catClean;
      }).length;
    });

    return {
      labels: categories,
      datasets: [
        {
          label: "Nombre d'alumni",
          data: counts,
          backgroundColor: (context: ScriptableContext<"bar">) => {
            if (!userComparison) return "#be9249";
            
            const index = context.dataIndex;
            const label = categories[index];
            const salary = userComparison.salary;
            
            // Simple mapping logic matching parseSalaryRange ranges
            let isMatch = false;
            const normalize = (str: string) => str.toLowerCase().replace(/\s/g, "");
            const catNorm = normalize(label);
            
            if (catNorm.includes("moinsde30") && salary < 30000) isMatch = true;
            else if (catNorm.includes("plusde100") && salary > 100000) isMatch = true;
            else {
               const matches = catNorm.match(/(\d+)-(\d+)/);
               if (matches) {
                 const min = parseInt(matches[1]) * 1000;
                 const max = parseInt(matches[2]) * 1000;
                 if (salary >= min && salary < max) isMatch = true;
               }
            }
            
            return isMatch ? "#ef4444" : "#be9249"; // Red highlight for user
          },
          borderRadius: 4,
        },
      ],
    };
  }, [data, userComparison]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (items: TooltipItem<"bar">[]) => `Tranche : ${items[0]?.label ?? ""}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
        grid: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}

export function XpChart({ data, userComparison }: ChartsProps) {
  const chartData = useMemo(() => {
    const xpMap: Record<number, { base: number[]; total: number[] }> = {};
    let maxXp = 0;

    data.forEach((item) => {
      const xp = Number(item.experience);
      if (!isNaN(xp)) {
        if (xp > maxXp) maxXp = xp;
        if (!xpMap[xp]) xpMap[xp] = { base: [], total: [] };

        const base = parseSalaryRange(item.salaire_brut);
        const prime = parsePrime(item.primes);

        if (base > 0) {
          xpMap[xp].base.push(base);
          xpMap[xp].total.push(base + prime);
        }
      }
    });

    const labels: number[] = [];
    for (let i = 0; i <= maxXp; i++) labels.push(i);

    const getStats = (arr: number[]) => {
      if (!arr || arr.length === 0) return null;
      const sum = arr.reduce((a, b) => a + b, 0);
      const mean = Math.round(sum / arr.length);
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median =
        sorted.length % 2 !== 0
          ? sorted[mid]
          : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
      return { mean, median };
    };

    const meanBaseData: (number | null)[] = [];
    const medianBaseData: (number | null)[] = [];
    const meanTotalData: (number | null)[] = [];
    const medianTotalData: (number | null)[] = [];

    labels.forEach((year) => {
      const group = xpMap[year];
      if (group) {
        const baseStats = getStats(group.base);
        const totalStats = getStats(group.total);
        meanBaseData.push(baseStats ? baseStats.mean : null);
        medianBaseData.push(baseStats ? baseStats.median : null);
        meanTotalData.push(totalStats ? totalStats.mean : null);
        medianTotalData.push(totalStats ? totalStats.median : null);
      } else {
        meanBaseData.push(null);
        medianBaseData.push(null);
        meanTotalData.push(null);
        medianTotalData.push(null);
      }
    });

    const datasets: Array<ChartDataset<"line", (number | null)[]>> = [
        {
          label: "Moyen (Base)",
          data: meanBaseData,
          borderColor: "#3b82f6",
          backgroundColor: "#3b82f6",
          borderWidth: 2,
          tension: 0.3,
          spanGaps: true,
        },
        {
          label: "Médian (Base)",
          data: medianBaseData,
          borderColor: "#3b82f6",
          backgroundColor: "#3b82f6",
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.3,
          spanGaps: true,
        },
        {
          label: "Moyen (Total)",
          data: meanTotalData,
          borderColor: "#be9249",
          backgroundColor: "#be9249",
          borderWidth: 2,
          tension: 0.3,
          spanGaps: true,
        },
        {
          label: "Médian (Total)",
          data: medianTotalData,
          borderColor: "#be9249",
          backgroundColor: "#be9249",
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.3,
          spanGaps: true,
        },
    ];

    if (userComparison) {
        // Add User Point
        const userPointData = labels.map(l => l === userComparison.experience ? userComparison.salary : null);
        datasets.push({
            label: "Vous",
            data: userPointData,
            borderColor: "#ef4444",
            backgroundColor: "#ef4444",
            pointRadius: 8,
            pointHoverRadius: 10,
            showLine: false,
            type: "line" // Treated as scatter on a line chart if only points
        });
    }

    return {
      labels: labels.map((l) => l + " ans"),
      datasets: datasets,
    };
  }, [data, userComparison]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<"line">) => {
            const raw = context.raw;
            if (raw === null || raw === undefined) return "";

            const value = typeof raw === "number" ? raw : Number(raw);
            if (!Number.isFinite(value)) return "";
            return `${context.dataset.label}: ${new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
              maximumFractionDigits: 0,
            }).format(value)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 30000,
        ticks: {
          callback: function (value: string | number) {
            const n = typeof value === "number" ? value : Number.parseFloat(value);
            return `${Math.round(n / 1000)}k€`;
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: "Années d'expérience",
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
}

export function BenefitsList({ data }: ChartsProps) {
  const stats = useMemo(() => {
    const count = data.length;
    if (count === 0) return [];

    const keywords = [
      { label: "Télétravail", terms: ["télétravail", "teletravail", "remote"] },
      { label: "Tickets Resto", terms: ["ticket", "restaurant", "tr", "panier"] },
      { label: "Voiture", terms: ["voiture", "véhicule"] },
      { label: "RTT / Congés", terms: ["rtt", "congés", "vacances"] },
      {
        label: "Intéressement",
        terms: ["intéressement", "participation", "interessement"],
      },
    ];

    const s = keywords.map((k) => {
          const matchCount = data.filter((d) => {
        if (!d.avantages) return false;
        const text = d.avantages.toLowerCase();
        return k.terms.some((term) => text.includes(term));
      }).length;

      return {
        label: k.label,
        percentage: Math.round((matchCount / count) * 100),
      };
    });

    return s.sort((a, b) => b.percentage - a.percentage);
  }, [data]);

  if (data.length === 0) return <p style={{ color: "var(--text-muted)" }}>Pas de données.</p>;

  return (
    <div className="benefits-list">
      {stats.map((stat) =>
        stat.percentage > 0 ? (
          <div key={stat.label} className="benefit-row">
            <div className="benefit-info">
              <span>{stat.label}</span>
              <span>{stat.percentage}%</span>
            </div>
            <div className="benefit-bar-bg">
              <div
                className="benefit-bar-fill"
                style={{ width: `${stat.percentage}%` }}
              ></div>
            </div>
          </div>
        ) : null
      )}
    </div>
  );
}

export function AnecdotesList({
  data,
  hasActiveFilters,
}: {
  data: SurveyResponse[];
  hasActiveFilters: boolean;
}) {
  const withConseil = useMemo(() => {
    return data.filter((d) => {
        const conseil = d.conseil;
        return conseil && conseil.trim() !== "";
    });
  }, [data]);

  if (!hasActiveFilters) {
    return (
      <p style={{ color: "var(--text-muted)" }}>
        Veuillez choisir un filtre pour voir les commentaires.
      </p>
    );
  }

  if (withConseil.length === 0) {
    return (
      <p style={{ color: "var(--text-muted)" }}>
        Aucun commentaire pour cette sélection.
      </p>
    );
  }

  return (
    <div id="anecdotes-list" className="anecdotes-list">
      {withConseil.map((item, i) => (
        <div key={i} className="anecdote-card">
          <p>&quot;{item.conseil}&quot;</p>
          <div className="anecdote-meta">
            {item.poste} - {item.secteur} ({item.experience} ans exp.)
          </div>
        </div>
      ))}
    </div>
  );
}
