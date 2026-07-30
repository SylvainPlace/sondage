"use client";

import { useEffect } from "react";

import styles from "./AlumniPrototype.module.css";

export const PROTOTYPE_VARIANTS = [
  { key: "A", label: "Cockpit clair" },
  { key: "B", label: "Rapport narratif" },
  { key: "C", label: "Studio de données" },
] as const;

export const PROTOTYPE_VIEWS = [
  { key: "public", label: "Accueil", shortLabel: "Accueil" },
  { key: "cockpit", label: "Cockpit", shortLabel: "Cockpit" },
  { key: "contribution", label: "Contribution", shortLabel: "Saisie" },
  { key: "explorer", label: "Explorateur", shortLabel: "Analyse" },
  { key: "admin", label: "Admin", shortLabel: "Admin" },
] as const;

export const PROTOTYPE_STATES = [
  { key: "default", label: "Complet" },
  { key: "empty", label: "Vide" },
  { key: "loading", label: "Chargement" },
  { key: "error", label: "Erreur" },
  { key: "historical", label: "Historique" },
  { key: "suppressed", label: "Confidentiel" },
] as const;

export type PrototypeVariant = (typeof PROTOTYPE_VARIANTS)[number]["key"];
export type PrototypeView = (typeof PROTOTYPE_VIEWS)[number]["key"];
export type PrototypeState = (typeof PROTOTYPE_STATES)[number]["key"];

interface PrototypeSwitcherProps {
  variant: PrototypeVariant;
  view: PrototypeView;
  state: PrototypeState;
  onVariantChange: (variant: PrototypeVariant) => void;
  onViewChange: (view: PrototypeView) => void;
  onStateChange: (state: PrototypeState) => void;
}

export default function PrototypeSwitcher({
  variant,
  view,
  state,
  onVariantChange,
  onViewChange,
  onStateChange,
}: PrototypeSwitcherProps) {
  const currentIndex = PROTOTYPE_VARIANTS.findIndex((item) => item.key === variant);

  const cycle = (direction: -1 | 1) => {
    const nextIndex =
      (currentIndex + direction + PROTOTYPE_VARIANTS.length) % PROTOTYPE_VARIANTS.length;
    const next = PROTOTYPE_VARIANTS[nextIndex];
    if (next) onVariantChange(next.key);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "ArrowLeft") cycle(-1);
      if (event.key === "ArrowRight") cycle(1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const current = PROTOTYPE_VARIANTS[currentIndex];

  return (
    <aside className={styles.prototypeDock} aria-label="Contrôles du prototype">
      <div className={styles.prototypeTabs} aria-label="Écran simulé">
        {PROTOTYPE_VIEWS.map((item) => (
          <button
            type="button"
            key={item.key}
            className={item.key === view ? styles.prototypeTabActive : styles.prototypeTab}
            onClick={() => onViewChange(item.key)}
            aria-label={item.label}
          >
            <span className={styles.prototypeTabLabel}>{item.label}</span>
            <span className={styles.prototypeTabShort}>{item.shortLabel}</span>
          </button>
        ))}
      </div>

      <div className={styles.prototypeVariant}>
        <button
          type="button"
          className={styles.prototypeArrow}
          onClick={() => cycle(-1)}
          aria-label="Proposition précédente"
        >
          ←
        </button>
        <strong>
          {current?.key} — {current?.label}
        </strong>
        <button
          type="button"
          className={styles.prototypeArrow}
          onClick={() => cycle(1)}
          aria-label="Proposition suivante"
        >
          →
        </button>
      </div>

      <label className={styles.prototypeState}>
        <span>État</span>
        <select
          value={state}
          onChange={(event) => onStateChange(event.target.value as PrototypeState)}
        >
          {PROTOTYPE_STATES.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
    </aside>
  );
}
