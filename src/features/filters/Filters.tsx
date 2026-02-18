"use client";

import { useMemo, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { SurveyResponse } from "@/types";
import { Dropdown } from "@/components/ui/Dropdown";
import styles from "./Filters.module.css";

interface FilterConfig {
  label: string;
  key: keyof SurveyResponse;
}

const disabledOptionMessage =
  "Il n’y a pas assez de données. Pour des raisons d’anonymat, nous ne pouvons pas afficher ces données. Essayez d’enlever d’abord certains filtres.";

const filtersConfig: FilterConfig[] = [
  { label: "Année de Diplôme", key: "annee_diplome" },
  { label: "Sexe", key: "sexe" },
  { label: "Expérience", key: "xp_group" },
  { label: "Poste", key: "poste" },
  { label: "Secteur d'activité", key: "secteur" },
  { label: "Type de structure", key: "type_structure" },
  { label: "Région", key: "departement" },
];

export default function Filters() {
  const { results, activeFilters, setFilters, resetFilters } = useDashboard();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleToggle = (key: string) => {
    setOpenDropdown(openDropdown === key ? null : key);
  };

  const handleFilterChange = (key: string, value: string, checked: boolean) => {
    const currentValues = activeFilters[key] || [];
    let newValues: string[];

    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter((v) => v !== value);
    }

    const newFilters = { ...activeFilters };
    if (newValues.length > 0) {
      newFilters[key] = newValues;
    } else {
      delete newFilters[key];
    }
    setFilters(newFilters);
  };

  const handleSelectAll = (key: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    setFilters(newFilters);
  };

  const filtersData = useMemo(() => results?.filters ?? {}, [results]);

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
        {filtersConfig.map((config) => {
          const options = filtersData[config.key] || [];
          const counts = options.reduce(
            (
              acc: Record<string, number>,
              item: { value: string; count: number },
            ) => {
              acc[item.value] = item.count;
              return acc;
            },
            {},
          );
          const uniqueValues = options
            .map((item: { value: string }) => item.value)
            .sort((a: unknown, b: unknown) => {
              const specialValues = ["Autre", "Non renseigné"];
              const aStr = String(a);
              const bStr = String(b);
              const isASpecial = specialValues.includes(aStr);
              const isBSpecial = specialValues.includes(bStr);
              if (isASpecial && !isBSpecial) {
                return 1;
              }
              if (!isASpecial && isBSpecial) {
                return -1;
              }
              if (isASpecial && isBSpecial) {
                return aStr.localeCompare(bStr);
              }

              if (config.key === "xp_group") {
                const order = [
                  "0-1 an",
                  "2-3 ans",
                  "4-5 ans",
                  "6-9 ans",
                  "10+ ans",
                  "Non renseigné",
                ];
                return order.indexOf(aStr) - order.indexOf(bStr);
              }
              const aNum = Number(aStr);
              const bNum = Number(bStr);
              return !Number.isNaN(aNum) && !Number.isNaN(bNum)
                ? aNum - bNum
                : aStr.localeCompare(bStr);
            });

          const selected = activeFilters[config.key] || [];
          const isAll = selected.length === 0;

          return (
            <div key={config.key} className={styles.group}>
              <label className={styles.label}>{config.label}</label>
              <Dropdown
                label={config.label}
                triggerLabel={
                  isAll
                    ? "Tous"
                    : selected.length === 1
                      ? selected[0]
                      : `${selected.length} sélectionnés`
                }
                isOpen={openDropdown === config.key}
                onToggle={() => handleToggle(config.key)}
              >
                <label className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    checked={isAll}
                    onChange={() => handleSelectAll(config.key)}
                  />
                  <span className={styles.optionText}>Tous</span>
                </label>
                {uniqueValues.map((val: unknown) => {
                  if (val === undefined || val === null || val === "") {
                    return null;
                  }
                  const count = counts[String(val)] || 0;
                  const isDisabled = count < 3;
                  return (
                    <label
                      key={String(val)}
                      className={`${styles.checkboxOption} ${
                        isDisabled ? styles.disabledOption : ""
                      }`}
                      data-tooltip={
                        isDisabled ? disabledOptionMessage : undefined
                      }
                      aria-disabled={isDisabled}
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(String(val))}
                        disabled={isDisabled}
                        onChange={(e) =>
                          handleFilterChange(
                            config.key,
                            String(val),
                            e.target.checked,
                          )
                        }
                      />
                      <span className={styles.optionText}>
                        {String(val)} ({count})
                      </span>
                    </label>
                  );
                })}
              </Dropdown>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
