"use client";

import { useState, useEffect } from "react";

export interface UserComparisonData {
  salary: number;
  experience: number;
}

interface ComparisonFormProps {
  onCompare: (data: UserComparisonData | null) => void;
}

export default function ComparisonForm({ onCompare }: ComparisonFormProps) {
  const [salary, setSalary] = useState<string>("");
  const [experience, setExperience] = useState<string>("");
  const [active, setActive] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem("user_comparison");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData) as UserComparisonData;
        setSalary(parsed.salary.toString());
        setExperience(parsed.experience.toString());
        setActive(true);
        onCompare(parsed);
      } catch (e) {
        console.error("Failed to parse saved comparison data", e);
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sal = parseInt(salary);
    const xp = parseInt(experience);

    if (!isNaN(sal) && !isNaN(xp)) {
      const data = { salary: sal, experience: xp };
      onCompare(data);
      setActive(true);
      localStorage.setItem("user_comparison", JSON.stringify(data));
    }
  };

  const handleReset = () => {
    setSalary("");
    setExperience("");
    setActive(false);
    onCompare(null);
    localStorage.removeItem("user_comparison");
  };

  if (active) {
    return (
      <div className="filters-panel" style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h3>Mode Comparaison Activé</h3>
        <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
          Vous visualisez votre position ({salary} €, {experience} ans) sur les graphiques.
        </p>
        <button className="btn-text" onClick={handleReset}>
          Arrêter la comparaison
        </button>
      </div>
    );
  }

  return (
    <div className="filters-panel" style={{ marginBottom: "2rem" }}>
      <div className="filter-header">
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          Me Comparer
          <div style={{ position: "relative" }}>
            <span
              onClick={() => setShowTooltip(!showTooltip)}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                backgroundColor: "#e2e8f0",
                color: "#64748b",
                fontSize: "12px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              i
            </span>
            {showTooltip && (
              <div
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  marginBottom: "8px",
                  padding: "0.5rem",
                  backgroundColor: "#1e293b",
                  color: "white",
                  fontSize: "0.75rem",
                  borderRadius: "4px",
                  width: "200px",
                  textAlign: "center",
                  zIndex: 10,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  pointerEvents: "none",
                }}
              >
                Vos données sont stockées uniquement dans votre navigateur et ne sont jamais envoyées à nos serveurs.
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    borderWidth: "4px",
                    borderStyle: "solid",
                    borderColor: "#1e293b transparent transparent transparent",
                  }}
                />
              </div>
            )}
          </div>
        </h2>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="filter-group" style={{ flex: 1, minWidth: "200px", marginBottom: 0 }}>
          <label htmlFor="comp-salary">Salaire Brut Annuel (€)</label>
          <input
            id="comp-salary"
            type="number"
            placeholder="ex: 45000"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              fontSize: "0.875rem"
            }}
            required
          />
        </div>
        <div className="filter-group" style={{ flex: 1, minWidth: "200px", marginBottom: 0 }}>
          <label htmlFor="comp-xp">Années d'expérience</label>
          <input
            id="comp-xp"
            type="number"
            placeholder="ex: 5"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              fontSize: "0.875rem"
            }}
            required
          />
        </div>
        <button
          type="submit"
          className="cta-button"
          style={{ padding: "0.75rem 1.5rem", borderRadius: "4px", fontSize: "0.875rem" }}
        >
          Comparer
        </button>
      </form>
    </div>
  );
}
