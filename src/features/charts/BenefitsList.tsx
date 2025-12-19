"use client";

import { useMemo } from "react";
import { SurveyResponse } from "@/types";
import styles from "@/features/charts/BenefitsList.module.css";

interface BenefitsListProps {
  data: SurveyResponse[];
}

export function BenefitsList({ data }: BenefitsListProps) {
  const stats = useMemo(() => {
    const count = data.length;
    if (count === 0) {
      return [];
    }

    const keywords = [
      { label: "Télétravail", terms: ["télétravail", "teletravail", "remote"] },
      {
        label: "Tickets Resto",
        terms: ["ticket", "restaurant", "tr", "panier"],
      },
      { label: "Voiture", terms: ["voiture", "véhicule"] },
      { label: "RTT / Congés", terms: ["rtt", "congés", "vacances"] },
      {
        label: "Intéressement",
        terms: ["intéressement", "participation", "interessement"],
      },
      {
        label: "Mutuelle gratuite",
        terms: [
          "mutuelle gratuite",
          "mutuelle pris en charge à 100%",
          "mutuelle prise en charge à 100%",
        ],
      },
    ];

    const s = keywords.map((k) => {
      const matchCount = data.filter((d) => {
        if (!d.avantages) {
          return false;
        }
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

  if (data.length === 0) {
    return <p style={{ color: "var(--text-muted)" }}>Pas de données.</p>;
  }

  return (
    <div className={styles.benefitsList}>
      {stats.map((stat) =>
        stat.percentage > 0 ? (
          <div key={stat.label} className={styles.benefitRow}>
            <div className={styles.benefitInfo}>
              <span>{stat.label}</span>
              <span>{stat.percentage}%</span>
            </div>
            <div className={styles.benefitBarBg}>
              <div
                className={styles.benefitBarFill}
                style={{ width: `${stat.percentage}%` }}
              ></div>
            </div>
          </div>
        ) : null,
      )}
    </div>
  );
}
