"use client";

import { useMemo, useState, useEffect } from "react";
import styles from "./FilterRange.module.css";

interface FilterRangeProps {
  label: string;
  options: { value: string; count: number }[];
  selected: string[];
  onChange: (values: string[]) => void;
}

const MIN_YEAR = 2015;
const MAX_YEAR = 2026;

export function FilterRange({
  label,
  options,
  selected,
  onChange,
}: FilterRangeProps) {
  const availableYears = useMemo(() => {
    const years = options
      .map((o) => Number(o.value))
      .filter((y) => !Number.isNaN(y) && y > 0)
      .sort((a, b) => a - b);
    return [...new Set(years)];
  }, [options]);

  const minYear =
    availableYears.length > 0 ? Math.min(...availableYears) : MIN_YEAR;
  const maxYear =
    availableYears.length > 0 ? Math.max(...availableYears) : MAX_YEAR;

  const [localMin, setLocalMin] = useState(minYear);
  const [localMax, setLocalMax] = useState(maxYear);

  useEffect(() => {
    if (selected.length === 0) {
      setLocalMin(minYear);
      setLocalMax(maxYear);
    } else {
      const years = selected
        .map((s) => Number(s))
        .filter((y) => !Number.isNaN(y));
      if (years.length > 0) {
        setLocalMin(Math.min(...years));
        setLocalMax(Math.max(...years));
      }
    }
  }, [selected, minYear, maxYear]);

  const handleMinChange = (value: number) => {
    const newMin = Math.min(value, localMax);
    setLocalMin(newMin);
    const allYears: string[] = [];
    for (let y = newMin; y <= localMax; y++) {
      allYears.push(String(y));
    }
    onChange(allYears);
  };

  const handleMaxChange = (value: number) => {
    const newMax = Math.max(value, localMin);
    setLocalMax(newMax);
    const allYears: string[] = [];
    for (let y = localMin; y <= newMax; y++) {
      allYears.push(String(y));
    }
    onChange(allYears);
  };

  const isAllSelected = localMin === minYear && localMax === maxYear;

  const handleReset = () => {
    setLocalMin(minYear);
    setLocalMax(maxYear);
    onChange([]);
  };

  const rangeLength = maxYear - minYear || 1;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <label className={styles.label}>{label}</label>
        {!isAllSelected && (
          <button
            type="button"
            className={styles.resetBtn}
            onClick={handleReset}
          >
            Réinitialiser
          </button>
        )}
      </div>

      <div className={styles.valueDisplay}>
        <span className={styles.value}>
          {isAllSelected ? "Toutes" : `${localMin} - ${localMax}`}
        </span>
        {!isAllSelected && (
          <span className={styles.badge}>{localMax - localMin + 1} ans</span>
        )}
      </div>

      <div className={styles.sliderContainer}>
        <div className={styles.sliderLabels}>
          <span>{minYear}</span>
          <span>{maxYear}</span>
        </div>
        <div className={styles.sliderTrack}>
          <div
            className={styles.sliderRange}
            style={{
              left: `${((localMin - minYear) / rangeLength) * 100}%`,
              right: `${100 - ((localMax - minYear) / rangeLength) * 100}%`,
            }}
          />
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={localMin}
            onChange={(e) => handleMinChange(Number(e.target.value))}
            className={`${styles.slider} ${styles.sliderMin}`}
          />
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={localMax}
            onChange={(e) => handleMaxChange(Number(e.target.value))}
            className={`${styles.slider} ${styles.sliderMax}`}
          />
        </div>
      </div>
    </div>
  );
}
