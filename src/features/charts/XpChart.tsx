"use client";

import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { ChartDataset, TooltipItem } from "chart.js";

import "@/features/charts/ChartConfig";
import { parsePrime, parseSalaryRange } from "@/lib/frontend-utils";
import { SurveyResponse, UserComparisonData } from "@/types";

interface XpChartProps {
  data: SurveyResponse[];
  userComparison?: UserComparisonData | null;
}

export function XpChart({ data, userComparison }: XpChartProps) {
  const chartData = useMemo(() => {
    const xpMap: Record<number, { base: number[]; total: number[] }> = {};
    let maxXp = 0;

    data.forEach((item) => {
      const xp = Number(item.experience);
      if (!isNaN(xp)) {
        if (xp > maxXp) {
          maxXp = xp;
        }
        if (!xpMap[xp]) {
          xpMap[xp] = { base: [], total: [] };
        }

        const base = parseSalaryRange(item.salaire_brut);
        const prime = parsePrime(item.primes);

        if (base > 0) {
          xpMap[xp].base.push(base);
          xpMap[xp].total.push(base + prime);
        }
      }
    });

    const labels: number[] = [];
    for (let i = 0; i <= maxXp; i++) {
      labels.push(i);
    }

    const getStats = (arr: number[]) => {
      if (!arr || arr.length === 0) {
        return null;
      }
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
      const userPointData = labels.map((l) =>
        l === userComparison.experience ? userComparison.salary : null,
      );
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
            if (raw === null || raw === undefined) {
              return "";
            }

            const value = typeof raw === "number" ? raw : Number(raw);
            if (!Number.isFinite(value)) {
              return "";
            }
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
            const n =
              typeof value === "number" ? value : Number.parseFloat(value);
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
