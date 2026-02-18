"use client";

import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { ChartDataset, TooltipItem } from "chart.js";

import "@/features/charts/ChartConfig";
import { UserComparisonData, XpByYearEntry } from "@/types";

interface XpChartProps {
  data: XpByYearEntry[];
  userComparison?: UserComparisonData | null;
}

export function XpChart({ data, userComparison }: XpChartProps) {
  const chartData = useMemo(() => {
    const labels = data.map((entry) => entry.year);

    const meanBaseData = data.map((entry) => entry.meanBase);
    const medianBaseData = data.map((entry) => entry.medianBase);
    const meanTotalData = data.map((entry) => entry.meanTotal);
    const medianTotalData = data.map((entry) => entry.medianTotal);

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

    if (userComparison && labels.length > 0) {
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
