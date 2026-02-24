"use client";

import styles from "./FilterToggle.module.css";

interface FilterToggleProps {
  label: string;
  options: { value: string; count: number }[];
  selected: string[];
  onChange: (values: string[]) => void;
}

export function FilterToggle({
  label,
  options,
  selected,
  onChange,
}: FilterToggleProps) {
  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleReset = () => {
    onChange([]);
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>
      <div className={styles.toggleGroup}>
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          const isDisabled = option.count < 3;

          return (
            <button
              key={option.value}
              type="button"
              className={`${styles.toggle} ${isSelected ? styles.active : ""} ${isDisabled ? styles.disabled : ""}`}
              onClick={() => !isDisabled && handleToggle(option.value)}
              disabled={isDisabled}
              title={isDisabled ? "Pas assez de données" : undefined}
            >
              <span className={styles.labelText}>{option.value}</span>
              <span className={styles.count}>{option.count}</span>
            </button>
          );
        })}
        {selected.length > 0 && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleReset}
            title="Réinitialiser"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
