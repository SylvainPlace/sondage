"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import styles from "./Dropdown.module.css";

interface DropdownProps {
  label: string;
  triggerLabel: ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  children: ReactNode;
  align?: "left" | "right";
}

export function Dropdown({
  triggerLabel,
  isOpen: controlledIsOpen,
  onToggle,
  children,
  align = "left",
}: DropdownProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isControlled = typeof controlledIsOpen !== "undefined";
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const toggle = () => {
    if (isControlled && onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        if (isControlled && onToggle && isOpen) {
          // If controlled, we can't just close it, we should notify parent if needed?
          // Actually parent usually manages 'openDropdown' state which is single string.
          // If we click outside, we want to close.
          // The parent 'handleClickOutside' in Filters.tsx handled this globally.
          // Here we want a self-contained dropdown or compatible.
          // If controlled, let parent handle outside click?
          // Or we call onToggle if it's open.
          // But wait, if multiple dropdowns are managed by parent, parent handles "click outside" globally usually?
          // Or each dropdown handles its own click outside?

          // Let's support both. If controlled, we assume parent might handle it, OR we call onToggle to close.
          // In Filters.tsx logic: "click outside -> setOpenDropdown(null)".
          // So if we detect click outside here, we can trigger onToggle (which should toggle off).
          onToggle();
        } else if (!isControlled && isOpen) {
          setInternalIsOpen(false);
        }
      }
    }

    // Only bind if open
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, isControlled, onToggle]);

  return (
    <div className={styles.container} ref={ref}>
      <button
        className={`${styles.trigger} ${isOpen ? styles.active : ""}`}
        onClick={toggle}
        aria-expanded={isOpen}
        type="button"
      >
        {triggerLabel}
      </button>
      {isOpen && (
        <div className={`${styles.content} ${styles[align]}`}>{children}</div>
      )}
    </div>
  );
}
