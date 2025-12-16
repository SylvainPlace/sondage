"use client";

import { useEffect, useState, useRef, useMemo } from "react";

import { SurveyResponse } from "@/lib/types";

interface FilterConfig {
  label: string;
  key: keyof SurveyResponse;
}

const filtersConfig: FilterConfig[] = [
  { label: "Année de Diplôme", key: "annee_diplome" },
  { label: "Sexe", key: "sexe" },
  { label: "Expérience", key: "xp_group" },
  { label: "Poste", key: "poste" },
  { label: "Secteur d'activité", key: "secteur" },
  { label: "Type de structure", key: "type_structure" },
  { label: "Région", key: "departement" },
];

interface FiltersProps {
  data: SurveyResponse[];
  activeFilters: Record<string, string[]>;
  onChange: (newFilters: Record<string, string[]>) => void;
  onReset: () => void;
}

export default function Filters({
  data,
  activeFilters,
  onChange,
  onReset,
}: FiltersProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        openDropdown &&
        dropdownRefs.current[openDropdown] &&
        !dropdownRefs.current[openDropdown]?.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  const toggleDropdown = (key: string) => {
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
    onChange(newFilters);
  };

  const handleSelectAll = (key: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    onChange(newFilters);
  };

  // Calculate counters dynamically with memoization
  const allCounts = useMemo(() => {
    const result: Record<string, Record<string, number>> = {};

    filtersConfig.forEach((config) => {
      const key = config.key;
      // Filter data based on OTHER active filters
      const contextFilters = { ...activeFilters };
      delete contextFilters[key];

      const contextData = data.filter((item) => {
        for (const k in contextFilters) {
          const filterValues = contextFilters[k];
          // We assume keys in activeFilters are valid keys of SurveyResponse
          // because they come from filtersConfig
          const itemValue = String(item[k as keyof SurveyResponse]);
          if (!filterValues.some((val) => String(val) === itemValue)) {
            return false;
          }
        }
        return true;
      });

      result[key] = contextData.reduce((acc: Record<string, number>, item) => {
        const val = String(item[key]);
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});
    });

    return result;
  }, [data, activeFilters]);

  return (
    <aside className="filters-panel">
      <div className="filter-header">
        <h2>Filtres</h2>
        <button id="reset-filters" className="btn-text" onClick={onReset}>
          Réinitialiser
        </button>
      </div>

      <div className="filters-container-responsive">
        {filtersConfig.map((config) => {
          const counts = allCounts[config.key] || {};
          const uniqueValues = Array.from(
            new Set(data.map((d) => d[config.key])),
          ).sort((a: unknown, b: unknown) => {
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
            <div key={config.key} className="filter-group">
              <label>{config.label}</label>
              <div
                className="custom-dropdown"
                ref={(el) => {
                  if (el) {
                    dropdownRefs.current[config.key] = el;
                  }
                }}
              >
                <button
                  className="dropdown-btn"
                  onClick={() => toggleDropdown(config.key)}
                >
                  {isAll
                    ? "Tous"
                    : selected.length === 1
                      ? selected[0]
                      : `${selected.length} sélectionnés`}
                </button>
                <div
                  className={`dropdown-content ${openDropdown === config.key ? "show" : ""}`}
                >
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={isAll}
                      onChange={() => handleSelectAll(config.key)}
                    />
                    <span className="option-text">Tous</span>
                  </label>
                  {uniqueValues.map((val: unknown) => {
                    if (val === undefined || val === null || val === "") {
                      return null;
                    }
                    return (
                      <label key={String(val)} className="checkbox-option">
                        <input
                          type="checkbox"
                          checked={selected.includes(String(val))}
                          onChange={(e) =>
                            handleFilterChange(
                              config.key,
                              String(val),
                              e.target.checked,
                            )
                          }
                        />
                        <span className="option-text">
                          {String(val)} ({counts[String(val)] || 0})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
