"use client";

import { useMemo, useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, TooltipItem } from "chart.js";

import "@/features/charts/ChartConfig";
import { SectorStat } from "@/types";

const SECTOR_COLORS = [
  "#be9249",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
  "#14b8a6",
  "#a855f7",
  "#eab308",
  "#22c55e",
];

export function SectorChart({ data }: { data: SectorStat[] }) {
  const [legendPosition, setLegendPosition] = useState<"right" | "bottom">(
    "right",
  );

  useEffect(() => {
    const handleResize = () => {
      setLegendPosition(window.innerWidth < 768 ? "bottom" : "right");
    };

    // Set initial position
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const chartData = useMemo(() => {
    const labels = data.map((item) => item.label);
    const counts = data.map((item) => item.count);

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
        position: legendPosition,
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
              const percentage =
                total > 0 ? Math.round((value / total) * 100) : 0;
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
            const percentage =
              total > 0 ? Math.round((value / total) * 100) : 0;
            return `${context.label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  if (!data || data.length === 0) {
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
      const dataArr = dataset.data as number[];
      const total = dataArr.reduce((a, b) => a + b, 0);

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
      <Doughnut
        data={chartData}
        options={options}
        plugins={[textCenterPlugin]}
      />
    </div>
  );
}
