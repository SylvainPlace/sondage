export const filtersConfig = [
  { label: "Année de Diplôme", key: "annee_diplome" },
  { label: "Sexe", key: "sexe" },
  { label: "Expérience", key: "xp_group" },
  { label: "Poste", key: "poste" },
  { label: "Secteur d'activité", key: "secteur" },
  { label: "Type de structure", key: "type_structure" },
  { label: "Région", key: "departement" },
];

export function initFilters(allData, updateCallback) {
  const container = document.getElementById("filters-container");
  container.innerHTML = "";

  filtersConfig.forEach((config) => {
    const uniqueValues = [
      ...new Set(allData.map((item) => item[config.key])),
    ].sort((a, b) => {
      // Force "Autre" and "Non renseigné" to the end
      const specialValues = ["Autre", "Non renseigné"];
      const isASpecial = specialValues.includes(a);
      const isBSpecial = specialValues.includes(b);

      if (isASpecial && !isBSpecial) return 1;
      if (!isASpecial && isBSpecial) return -1;
      if (isASpecial && isBSpecial) return a.localeCompare(b);

      if (config.key === "xp_group") {
        const order = [
          "0-1 an",
          "2-3 ans",
          "4-5 ans",
          "6-9 ans",
          "10+ ans",
          "Non renseigné",
        ];
        return order.indexOf(a) - order.indexOf(b);
      }
      return !isNaN(a) && !isNaN(b)
        ? a - b
        : String(a).localeCompare(String(b));
    });

    const group = document.createElement("div");
    group.className = "filter-group";

    const label = document.createElement("label");
    label.textContent = config.label;

    const dropdown = document.createElement("div");
    dropdown.className = "custom-dropdown";

    const dropdownBtn = document.createElement("button");
    dropdownBtn.className = "dropdown-btn";
    dropdownBtn.textContent = "Tous";
    dropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".dropdown-content.show").forEach((el) => {
        if (el !== dropdownContent) el.classList.remove("show");
      });
      dropdownContent.classList.toggle("show");
    });

    const dropdownContent = document.createElement("div");
    dropdownContent.className = "dropdown-content";

    const allOptionDiv = document.createElement("label");
    allOptionDiv.className = "checkbox-option";
    const allCheckbox = document.createElement("input");
    allCheckbox.type = "checkbox";
    allCheckbox.id = `filter-${config.key}-all`;
    allCheckbox.checked = true;
    allCheckbox.addEventListener("change", () => {
      if (allCheckbox.checked) {
        dropdownContent
          .querySelectorAll("input:not(#filter-" + config.key + "-all)")
          .forEach((cb) => (cb.checked = false));
        updateBtnText(dropdownBtn, dropdownContent, config.key, allCheckbox);
        updateCallback();
      } else {
        const anyChecked = Array.from(
          dropdownContent.querySelectorAll(
            "input:not(#filter-" + config.key + "-all)"
          )
        ).some((cb) => cb.checked);
        if (!anyChecked) allCheckbox.checked = true;
      }
    });

    const allLabel = document.createElement("span");
    allLabel.className = "option-text";
    allLabel.textContent = "Tous";

    allOptionDiv.appendChild(allCheckbox);
    allOptionDiv.appendChild(allLabel);
    dropdownContent.appendChild(allOptionDiv);

    const counts = allData.reduce((acc, item) => {
      const val = item[config.key];
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});

    uniqueValues.forEach((val, index) => {
      if (val !== undefined && val !== null && val !== "") {
        const optionDiv = document.createElement("label");
        optionDiv.className = "checkbox-option";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `filter-${config.key}-${index}`;
        checkbox.value = val;
        checkbox.dataset.key = config.key;

        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            allCheckbox.checked = false;
          } else {
            const anyChecked = Array.from(
              dropdownContent.querySelectorAll(
                "input:not(#filter-" + config.key + "-all)"
              )
            ).some((cb) => cb.checked);
            if (!anyChecked) allCheckbox.checked = true;
          }
          updateBtnText(dropdownBtn, dropdownContent, config.key, allCheckbox);
          updateCallback();
        });

        const optLabel = document.createElement("span");
        optLabel.className = "option-text";
        optLabel.textContent = `${val} (${counts[val] || 0})`;

        optionDiv.appendChild(checkbox);
        optionDiv.appendChild(optLabel);
        dropdownContent.appendChild(optionDiv);
      }
    });

    dropdown.appendChild(dropdownBtn);
    dropdown.appendChild(dropdownContent);
    group.appendChild(label);
    group.appendChild(dropdown);
    container.appendChild(group);
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".custom-dropdown")) {
      document
        .querySelectorAll(".dropdown-content.show")
        .forEach((el) => el.classList.remove("show"));
    }
  });
}

function updateBtnText(btn, content, key, allCheckbox) {
  const checked = Array.from(
    content.querySelectorAll("input:not(#filter-" + key + "-all):checked")
  );
  if (checked.length === 0) {
    btn.textContent = "Tous";
    allCheckbox.checked = true;
  } else if (checked.length === 1) {
    btn.textContent = checked[0].value;
  } else {
    btn.textContent = `${checked.length} sélectionnés`;
  }
}

export function resetFilters(updateCallback) {
  document.querySelectorAll(".custom-dropdown").forEach((dropdown) => {
    const allCheckbox = dropdown.querySelector('input[id$="-all"]');
    if (allCheckbox) {
      allCheckbox.checked = true;
      dropdown
        .querySelectorAll('input:not([id$="-all"])')
        .forEach((cb) => (cb.checked = false));
      const btn = dropdown.querySelector(".dropdown-btn");
      if (btn) btn.textContent = "Tous";
    }
  });
  updateCallback();
}

export function getActiveFilters() {
  const activeFilters = {};
  document.querySelectorAll(".custom-dropdown").forEach((dropdown) => {
    const checkboxes = Array.from(
      dropdown.querySelectorAll('input:checked:not([id$="-all"])')
    );
    if (checkboxes.length > 0) {
      const key = checkboxes[0].dataset.key;
      if (key) {
        activeFilters[key] = checkboxes.map((cb) => cb.value);
      }
    }
  });
  return activeFilters;
}

export function updateFilterCounters(allData, activeFilters) {
  filtersConfig.forEach((config) => {
    const contextFilters = { ...activeFilters };
    delete contextFilters[config.key];

    const contextData = allData.filter((item) => {
      for (const key in contextFilters) {
        const filterValues = contextFilters[key];
        const itemValue = String(item[key]);
        if (!filterValues.some((val) => String(val) === itemValue)) {
          return false;
        }
      }
      return true;
    });

    const counts = contextData.reduce((acc, item) => {
      const val = item[config.key];
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});

    // Mise à jour des labels dans le dropdown correspondant
    // On cherche le input correspondant à la clé
    const inputs = document.querySelectorAll(`input[data-key="${config.key}"]`);
    inputs.forEach((input) => {
      const val = input.value;
      const count = counts[val] || 0;
      // Le label est le sibling direct ou via un id
      const textSpan = input.parentNode.querySelector(".option-text");
      if (textSpan) {
        textSpan.textContent = `${val} (${count})`;
      }
    });
  });
}
