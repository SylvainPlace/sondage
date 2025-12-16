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
  ArcElement,
  type ChartDataset,
  type ScriptableContext,
  type TooltipItem,
} from "chart.js";
import { useMemo } from "react";
import { Bar, Line, Doughnut } from "react-chartjs-2";

import { parsePrime, parseSalaryRange } from "@/lib/frontend-utils";
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
  Filler,
  ArcElement,
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
          if (!str) {return "";}
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
            if (!userComparison) {return "#be9249";}
            
            const index = context.dataIndex;
            const label = categories[index];
            const salary = userComparison.salary;
            
            // Simple mapping logic matching parseSalaryRange ranges
            let isMatch = false;
            const normalize = (str: string) => str.toLowerCase().replace(/\s/g, "");
            const catNorm = normalize(label);
            
            if (catNorm.includes("moinsde30") && salary < 30000) {isMatch = true;} else if (catNorm.includes("plusde100") && salary > 100000) {isMatch = true;} else {
               const matches = catNorm.match(/(\d+)-(\d+)/);
               if (matches) {
                 const min = parseInt(matches[1]) * 1000;
                 const max = parseInt(matches[2]) * 1000;
                 if (salary >= min && salary < max) {isMatch = true;}
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
        if (xp > maxXp) {maxXp = xp;}
        if (!xpMap[xp]) {xpMap[xp] = { base: [], total: [] };}

        const base = parseSalaryRange(item.salaire_brut);
        const prime = parsePrime(item.primes);

        if (base > 0) {
          xpMap[xp].base.push(base);
          xpMap[xp].total.push(base + prime);
        }
      }
    });

    const labels: number[] = [];
    for (let i = 0; i <= maxXp; i++) {labels.push(i);}

    const getStats = (arr: number[]) => {
      if (!arr || arr.length === 0) {return null;}
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
            type: "line", // Treated as scatter on a line chart if only points
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
            if (raw === null || raw === undefined) {return "";}

            const value = typeof raw === "number" ? raw : Number(raw);
            if (!Number.isFinite(value)) {return "";}
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
    if (count === 0) {return [];}

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
        if (!d.avantages) {return false;}
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

  if (data.length === 0) {return <p style={{ color: "var(--text-muted)" }}>Pas de données.</p>;}

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
        ) : null,
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

const SECTOR_COLORS = [
  "#be9249", "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316",
  "#6366f1", "#14b8a6", "#a855f7", "#eab308", "#22c55e",
];

export function SectorChart({ data }: { data: SurveyResponse[] }) {
  const chartData = useMemo(() => {
    const sectorCounts: Record<string, number> = {};

    data.forEach((item) => {
      const sector = item.secteur || "Non renseigne";
      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
    });

    const sorted = Object.entries(sectorCounts)
      .sort((a, b) => b[1] - a[1]);

    const labels = sorted.map(([label]) => label);
    const counts = sorted.map(([, count]) => count);

    return {
      labels,
      datasets: [
        {
          data: counts,
          backgroundColor: SECTOR_COLORS.slice(0, labels.length),
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "right" as const,
        labels: {
          boxWidth: 12,
          padding: 12,
          font: { size: 11 },
          generateLabels: (chart: ChartJS<"doughnut">) => {
            const dataset = chart.data.datasets[0];
            const dataArr = dataset.data as number[];
            const total = dataArr.reduce((a, b) => a + b, 0);
            const labels = chart.data.labels as string[];
            const bgColors = dataset.backgroundColor as string[];
            return labels.map((label, i) => {
              const value = dataArr[i];
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return {
                text: `${label} (${percentage}%)`,
                fillStyle: bgColors[i],
                strokeStyle: dataset.borderColor as string,
                lineWidth: dataset.borderWidth as number,
                hidden: false,
                index: i,
              };
            });
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<"doughnut">) => {
            const value = context.raw as number;
            const dataArr = context.dataset.data as number[];
            const total = dataArr.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${context.label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  if (data.length === 0) {
    return <p style={{ color: "var(--text-muted)" }}>Pas de donnees.</p>;
  }

  const textCenterPlugin = {
    id: "textCenter",
    beforeDraw: function (chart: ChartJS) {
      const { ctx } = chart;
      const { top, bottom, left, right } = chart.chartArea;
      
      ctx.save();
      
      // Calculate center of the chart area (which excludes legend)
      const x = (left + right) / 2;
      const y = (top + bottom) / 2;
      
      const dataset = chart.data.datasets[0];
      const data = dataset.data as number[];
      const total = data.reduce((a, b) => a + b, 0);
      
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Total number
      ctx.font = "700 1.5rem Inter, sans-serif";
      ctx.fillStyle = "#1e293b"; // var(--text-main)
      ctx.fillText(total.toString(), x, y - 10);
      
      // Label
      ctx.font = "0.75rem Inter, sans-serif";
      ctx.fillStyle = "#64748b"; // var(--text-muted)
      ctx.fillText("répondants", x, y + 15);
      
      ctx.restore();
    },
  };

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <Doughnut data={chartData} options={options} plugins={[textCenterPlugin]} />
    </div>
  );
}
