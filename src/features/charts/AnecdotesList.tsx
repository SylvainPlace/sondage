"use client";

import { useMemo } from "react";
import { SurveyResponse } from "@/types";
import styles from "@/features/charts/AnecdotesList.module.css";

interface AnecdotesListProps {
  data: SurveyResponse[];
  hasActiveFilters: boolean;
}

export function AnecdotesList({ data, hasActiveFilters }: AnecdotesListProps) {
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
    <div id="anecdotes-list" className={styles.anecdotesList}>
      {withConseil.map((item, i) => (
        <div key={i} className={styles.anecdoteCard}>
          <p>&quot;{item.conseil}&quot;</p>
          <div className={styles.anecdoteMeta}>
            {item.poste} - {item.secteur} ({item.experience} ans exp.)
          </div>
        </div>
      ))}
    </div>
  );
}
