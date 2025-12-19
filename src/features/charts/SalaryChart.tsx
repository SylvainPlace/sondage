"use client";

import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { ScriptableContext, TooltipItem } from "chart.js";

import "@/features/charts/ChartConfig";
import { SurveyResponse, UserComparisonData } from "@/types";

interface SalaryChartProps {
  data: SurveyResponse[];
  userComparison?: UserComparisonData | null;
}

export function SalaryChart({ data, userComparison }: SalaryChartProps) {
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
          if (!str) {
            return "";
          }
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
            if (!userComparison) {
              return "#be9249";
            }

            const index = context.dataIndex;
            const label = categories[index];
            const salary = userComparison.salary;

            // Simple mapping logic matching parseSalaryRange ranges
            let isMatch = false;
            const normalize = (str: string) =>
              str.toLowerCase().replace(/\s/g, "");
            const catNorm = normalize(label);

            if (catNorm.includes("moinsde30") && salary < 30000) {
              isMatch = true;
            } else if (catNorm.includes("plusde100") && salary > 100000) {
              isMatch = true;
            } else {
              const matches = catNorm.match(/(\d+)-(\d+)/);
              if (matches) {
                const min = parseInt(matches[1]) * 1000;
                const max = parseInt(matches[2]) * 1000;
                if (salary >= min && salary < max) {
                  isMatch = true;
                }
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
          title: (items: TooltipItem<"bar">[]) =>
            `Tranche : ${items[0]?.label ?? ""}`,
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
