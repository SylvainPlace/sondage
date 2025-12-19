"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { UserComparisonData } from "@/types";
import { Button } from "@/components/ui/Button";
import styles from "./ComparisonForm.module.css";

export default function ComparisonForm() {
  const { setUserComparison } = useDashboard();

  const getInitialComparison = (): UserComparisonData | null => {
    const saved = localStorage.getItem("user_comparison");
    if (saved) {
      try {
        return JSON.parse(saved) as UserComparisonData;
      } catch (e) {
        console.error("Failed to parse saved comparison data", e);
        return null;
      }
    }
    return null;
  };

  const initialData = useMemo(() => getInitialComparison(), []);

  const [salary, setSalary] = useState(
    initialData ? initialData.salary.toString() : "",
  );
  const [experience, setExperience] = useState(
    initialData ? initialData.experience.toString() : "",
  );
  const [active, setActive] = useState(!!initialData);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const infoIconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (initialData) {
      setUserComparison(initialData);
    }
  }, [setUserComparison, initialData]);

  useEffect(() => {
    if (showTooltip && infoIconRef.current) {
      const rect = infoIconRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top - 10, // 10px above the icon
        left: rect.left - 100, // Center the tooltip (200px width / 2)
      });
    }
  }, [showTooltip]);

  useEffect(() => {
    if (showTooltip && infoIconRef.current) {
      const rect = infoIconRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top + 22, // 10px above the icon
        left: rect.left - 100, // Center the tooltip (200px width / 2)
      });
    }
  }, [showTooltip]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sal = parseInt(salary);
    const xp = parseInt(experience);

    if (!isNaN(sal) && !isNaN(xp)) {
      const data = { salary: sal, experience: xp };
      setUserComparison(data);
      setActive(true);
      localStorage.setItem("user_comparison", JSON.stringify(data));
    }
  };

  const handleReset = () => {
    setSalary("");
    setExperience("");
    setActive(false);
    setUserComparison(null);
    localStorage.removeItem("user_comparison");
  };

  if (active) {
    return (
      <div className={styles.activePanel}>
        <h3>Mode Comparaison Activé</h3>
        <p className={styles.activeText}>
          Vous visualisez votre position ({salary} €, {experience} ans) sur les
          graphiques.
        </p>
        <Button variant="text" onClick={handleReset}>
          Arrêter la comparaison
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2>
          Me Comparer
          <div className={styles.tooltipContainer}>
            <span
              ref={infoIconRef}
              className={styles.infoIcon}
              onClick={() => setShowTooltip(!showTooltip)}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              i
            </span>
            {showTooltip && (
              <div
                className={styles.tooltip}
                style={{
                  top: `${tooltipPosition.top}px`,
                  left: `${tooltipPosition.left}px`,
                }}
              >
                Vos données sont stockées uniquement dans votre navigateur et ne
                sont jamais envoyées à nos serveurs.
                <div className={styles.tooltipArrow} />
              </div>
            )}
          </div>
        </h2>
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="comp-salary" className={styles.label}>
            Salaire Brut Annuel (€)
          </label>
          <input
            id="comp-salary"
            type="number"
            placeholder="ex: 45000"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            className={styles.input}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="comp-xp" className={styles.label}>
            Années d&apos;expérience
          </label>
          <input
            id="comp-xp"
            type="number"
            placeholder="ex: 5"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className={styles.input}
            required
          />
        </div>
        <Button type="submit" variant="primary" className={styles.submitBtn}>
          Comparer
        </Button>
      </form>
    </div>
  );
}
