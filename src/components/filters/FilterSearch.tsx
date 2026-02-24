"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import styles from "./FilterSearch.module.css";

interface FilterSearchProps {
  label: string;
  options: { value: string; count: number }[];
  selected: string[];
  onChange: (values: string[]) => void;
}

export function FilterSearch({
  label,
  options,
  selected,
  onChange,
}: FilterSearchProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const searchLower = search.toLowerCase();
    return options.filter((opt) =>
      opt.value.toLowerCase().includes(searchLower),
    );
  }, [options, search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleSelectAll = () => {
    onChange([]);
    setSearch("");
    setIsOpen(false);
  };

  const isAllSelected = selected.length === 0;

  const displayLabel = isAllSelected
    ? "Tous"
    : selected.length === 1
      ? selected[0]
      : `${selected.length} sélectionnés`;

  return (
    <div className={styles.container} ref={containerRef}>
      <label className={styles.label}>{label}</label>

      <div className={styles.triggerContainer}>
        <button
          type="button"
          className={`${styles.trigger} ${isOpen ? styles.open : ""} ${selected.length > 0 ? styles.hasSelection : ""}`}
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) setTimeout(() => inputRef.current?.focus(), 50);
          }}
        >
          <span className={styles.triggerText}>{displayLabel}</span>
          {selected.length > 0 && (
            <span className={styles.badge}>{selected.length}</span>
          )}
          <span className={styles.chevron}>▼</span>
        </button>

        {selected.length > 0 && (
          <div className={styles.chipsContainer}>
            {selected.slice(0, 3).map((val) => (
              <span key={val} className={styles.chip}>
                {val}
                <button
                  type="button"
                  className={styles.chipRemove}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(val);
                  }}
                >
                  ×
                </button>
              </span>
            ))}
            {selected.length > 3 && (
              <span className={styles.chipMore}>+{selected.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.searchWrapper}>
            <svg
              className={styles.searchIcon}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              className={styles.searchInput}
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.optionsList}>
            <label className={styles.option}>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
              />
              <span className={styles.optionText}>Tous</span>
            </label>

            {filteredOptions.length === 0 ? (
              <div className={styles.noResults}>Aucun résultat</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selected.includes(option.value);
                const isDisabled = option.count < 3;

                return (
                  <label
                    key={option.value}
                    className={`${styles.option} ${isDisabled ? styles.disabled : ""}`}
                    title={isDisabled ? "Pas assez de données" : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={() => handleToggle(option.value)}
                    />
                    <span className={styles.optionText}>{option.value}</span>
                    <span className={styles.optionCount}>{option.count}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
