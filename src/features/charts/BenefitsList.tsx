"use client";

import { BenefitsStat } from "@/types";
import styles from "@/features/charts/BenefitsList.module.css";

interface BenefitsListProps {
  data: BenefitsStat[];
}

export function BenefitsList({ data }: BenefitsListProps) {
  if (!data || data.length === 0) {
    return <p style={{ color: "var(--text-muted)" }}>Pas de données.</p>;
  }

  return (
    <div className={styles.benefitsList}>
      {data.map((stat) =>
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
