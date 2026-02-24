"use client";

import styles from "./FilterPills.module.css";

interface FilterPillsProps {
  label: string;
  options: { value: string; count: number }[];
  selected: string[];
  onChange: (values: string[]) => void;
  sortOrder?: string[];
}

export function FilterPills({
  label,
  options,
  selected,
  onChange,
  sortOrder,
}: FilterPillsProps) {
  const sortedOptions = [...options].sort((a, b) => {
    if (sortOrder) {
      const aIndex = sortOrder.indexOf(a.value);
      const bIndex = sortOrder.indexOf(b.value);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
    }
    const aNum = Number(a.value);
    const bNum = Number(b.value);
    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
    return a.value.localeCompare(b.value);
  });

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleSelectAll = () => {
    onChange([]);
  };

  const isAllSelected = selected.length === 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <label className={styles.label}>{label}</label>
        {!isAllSelected && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleSelectAll}
          >
            Tout voir
          </button>
        )}
      </div>
      <div className={styles.pillsContainer}>
        {sortedOptions.map((option) => {
          const isSelected = selected.includes(option.value);
          const isDisabled = option.count < 3;

          return (
            <button
              key={option.value}
              type="button"
              className={`${styles.pill} ${isSelected ? styles.active : ""} ${isDisabled ? styles.disabled : ""}`}
              onClick={() => !isDisabled && handleToggle(option.value)}
              disabled={isDisabled}
              title={isDisabled ? "Pas assez de données" : undefined}
            >
              <span>{option.value}</span>
              <span className={styles.count}>{option.count}</span>
            </button>
          );
        })}
      </div>
      {!isAllSelected && (
        <div className={styles.selectedInfo}>
          {selected.length} sélectionné{selected.length > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
