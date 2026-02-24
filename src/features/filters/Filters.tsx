"use client";

import { useMemo } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { SurveyResponse } from "@/types";
import {
  FilterRange,
  FilterToggle,
  FilterPills,
  FilterSearch,
} from "@/components/filters";
import { Dropdown } from "@/components/ui/Dropdown";
import styles from "./Filters.module.css";

type FilterType = "range" | "toggle" | "pills" | "search" | "dropdown";

interface FilterConfig {
  label: string;
  key: keyof SurveyResponse;
  type: FilterType;
}

const XP_ORDER = [
  "0-1 an",
  "2-3 ans",
  "4-5 ans",
  "6-9 ans",
  "10+ ans",
  "Non renseigné",
];

const filtersConfig: FilterConfig[] = [
  { label: "Expérience", key: "xp_group", type: "pills" },
  { label: "Année de Diplôme", key: "annee_diplome", type: "range" },
  { label: "Sexe", key: "sexe", type: "toggle" },
  { label: "Poste", key: "poste", type: "search" },
  { label: "Secteur d'activité", key: "secteur", type: "search" },
  { label: "Type de structure", key: "type_structure", type: "pills" },
  { label: "Région", key: "departement", type: "dropdown" },
];

export default function Filters() {
  const { results, activeFilters, setFilters, resetFilters } = useDashboard();

  const handleFilterChange = (key: string, values: string[]) => {
    const newFilters = { ...activeFilters };
    if (values.length > 0) {
      newFilters[key] = values;
    } else {
      delete newFilters[key];
    }
    setFilters(newFilters);
  };

  const filtersData = useMemo(() => results?.filters ?? {}, [results]);

  const renderFilter = (config: FilterConfig) => {
    const options = filtersData[config.key] || [];
    const selected = activeFilters[config.key] || [];

    const commonProps = {
      label: config.label,
      options,
      selected,
      onChange: (values: string[]) => handleFilterChange(config.key, values),
    };

    switch (config.type) {
      case "range":
        return <FilterRange {...commonProps} />;
      case "toggle":
        return <FilterToggle {...commonProps} />;
      case "pills":
        return (
          <FilterPills
            {...commonProps}
            sortOrder={config.key === "xp_group" ? XP_ORDER : undefined}
          />
        );
      case "search":
        return <FilterSearch {...commonProps} />;
      case "dropdown":
      default:
        return (
          <DropdownFilter
            {...commonProps}
            onSelectAll={() => handleFilterChange(config.key, [])}
          />
        );
    }
  };

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <h2>Filtres</h2>
        <button
          className={styles.resetBtn}
          onClick={resetFilters}
          type="button"
        >
          Réinitialiser
        </button>
      </div>

      <div className={styles.grid}>
        {filtersConfig.map((config) => (
          <div key={config.key} className={styles.group}>
            {renderFilter(config)}
          </div>
        ))}
      </div>
    </aside>
  );
}

interface DropdownFilterProps {
  label: string;
  options: { value: string; count: number }[];
  selected: string[];
  onChange: (values: string[]) => void;
  onSelectAll: () => void;
}

function DropdownFilter({
  label,
  options,
  selected,
  onChange,
  onSelectAll,
}: DropdownFilterProps) {
  const handleToggle = (value: string, checked: boolean) => {
    let newValues: string[];
    if (checked) {
      newValues = [...selected, value];
    } else {
      newValues = selected.filter((v) => v !== value);
    }
    onChange(newValues);
  };

  const isAll = selected.length === 0;

  const sortedOptions = [...options].sort((a, b) => {
    const specialValues = ["Autre", "Non renseigné"];
    const aStr = a.value;
    const bStr = b.value;
    const isASpecial = specialValues.includes(aStr);
    const isBSpecial = specialValues.includes(bStr);
    if (isASpecial && !isBSpecial) return 1;
    if (!isASpecial && isBSpecial) return -1;
    if (isASpecial && isBSpecial) return aStr.localeCompare(bStr);
    return aStr.localeCompare(bStr);
  });

  return (
    <>
      <label className={styles.label}>{label}</label>
      <Dropdown
        label={label}
        triggerLabel={
          isAll
            ? "Tous"
            : selected.length === 1
              ? selected[0]
              : `${selected.length} sélectionnés`
        }
      >
        <label className={styles.checkboxOption}>
          <input type="checkbox" checked={isAll} onChange={onSelectAll} />
          <span className={styles.optionText}>Tous</span>
        </label>
        {sortedOptions.map((opt) => {
          const isDisabled = opt.count < 3;
          return (
            <label
              key={opt.value}
              className={`${styles.checkboxOption} ${
                isDisabled ? styles.disabledOption : ""
              }`}
              data-tooltip={
                isDisabled
                  ? "Pas assez de données. Pour des raisons d’anonymat, nous ne pouvons pas afficher ces données."
                  : undefined
              }
              aria-disabled={isDisabled}
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                disabled={isDisabled}
                onChange={(e) => handleToggle(opt.value, e.target.checked)}
              />
              <span className={styles.optionText}>
                {opt.value} ({opt.count})
              </span>
            </label>
          );
        })}
      </Dropdown>
    </>
  );
}
