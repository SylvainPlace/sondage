import { regionsData } from "./regions-data.js";
import { parseSalaryRange, parsePrime, formatMoney } from "./utils.js";

let map = null;
let geoJsonLayer = null;
let currentMode = "avg_base"; // 'avg_base', 'median_base', 'avg_total', 'median_total', 'count'
let legendControl = null;

// Color scale function for Salary
function getColor(d) {
  return d > 65000
    ? "#08519c"
    : d > 55000
    ? "#3182bd"
    : d > 45000
    ? "#6baed6"
    : d > 35000
    ? "#bdd7e7"
    : "#eff3ff";
}

// Color scale function for Count
function getColorCount(d) {
  return d > 50
    ? "#006d2c"
    : d > 20
    ? "#31a354"
    : d > 10
    ? "#74c476"
    : d > 5
    ? "#a1d99b"
    : "#edf8e9";
}

function style(feature) {
  const props = feature.properties;
  let color = "#f0f0f0";
  let value = 0;

  switch (currentMode) {
    case "avg_base":
      value = props.avgSalary;
      break;
    case "median_base":
      value = props.medianSalary;
      break;
    case "avg_total":
      value = props.avgTotal;
      break;
    case "median_total":
      value = props.medianTotal;
      break;
    case "count":
      value = props.count;
      break;
  }

  if (currentMode === "count") {
    if (value) color = getColorCount(value);
  } else {
    if (value) color = getColor(value);
  }

  return {
    fillColor: color,
    weight: 2,
    opacity: 1,
    color: "white",
    dashArray: "3",
    fillOpacity: 0.7,
  };
}

function highlightFeature(e) {
  var layer = e.target;

  layer.setStyle({
    weight: 3,
    color: "#666",
    dashArray: "",
    fillOpacity: 0.9,
  });

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }
}

function resetHighlight(e) {
  geoJsonLayer.resetStyle(e.target);
}

function normalizeRegionName(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s]/g, " ") // replace non-alphanumeric with space (removes ' and /)
    .replace(/\s+/g, " ")
    .trim();
}

export function setMapMode(mode) {
  currentMode = mode;

  // Redraw map style
  if (geoJsonLayer) {
    geoJsonLayer.setStyle(style);
  }

  // Update legend
  updateLegend();
}

function updateLegend() {
  if (legendControl) {
    legendControl.remove();
  }

  legendControl = L.control({ position: "bottomright" });

  legendControl.onAdd = function (map) {
    const div = L.DomUtil.create("div", "info legend");

    if (currentMode === "count") {
      const grades = [0, 5, 10, 20, 50];
      div.innerHTML += "<h4>Répondants</h4>";
      for (let i = 0; i < grades.length; i++) {
        div.innerHTML +=
          '<i style="background:' +
          getColorCount(grades[i] + 1) +
          '"></i> ' +
          grades[i] +
          (grades[i + 1] ? "&ndash;" + grades[i + 1] + "<br>" : "+");
      }
    } else {
      const grades = [0, 35000, 45000, 55000, 65000];
      let title = "Salaire";
      if (currentMode.includes("median")) title = "Salaire Médian";
      else title = "Salaire Moyen";

      if (currentMode.includes("total")) title += " (+ Primes)";

      div.innerHTML += `<h4>${title}</h4>`;
      for (let i = 0; i < grades.length; i++) {
        div.innerHTML +=
          '<i style="background:' +
          getColor(grades[i] + 1) +
          '"></i> ' +
          formatMoney(grades[i]) +
          (grades[i + 1]
            ? "&ndash;" + formatMoney(grades[i + 1]) + "<br>"
            : "+");
      }
    }

    return div;
  };

  legendControl.addTo(map);
}

export function initMap() {
  // Center on France
  map = L.map("map").setView([46.603354, 1.888334], 6);

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }
  ).addTo(map);

  // Initial empty layer
  geoJsonLayer = L.geoJson(regionsData, {
    style: style,
    onEachFeature: onEachFeature,
  }).addTo(map);

  updateLegend();
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
  });

  // Add tooltip
  const props = feature.properties;
  if (props && props.nom) {
    let content = `<strong>${props.nom}</strong><br/>`;
    if (props.avgSalary) {
      content += `Moyen: ${formatMoney(props.avgSalary)}<br/>`;
      content += `Médian: ${formatMoney(props.medianSalary)}<br/>`;
      content += `Moyen (+Primes): ${formatMoney(props.avgTotal)}<br/>`;
      content += `Médian (+Primes): ${formatMoney(props.medianTotal)}<br/>`;
      content += `Répondants: ${props.count}`;
    } else {
      content += "Pas de données";
    }
    layer.bindTooltip(content);
  }
}

export function updateMap(data) {
  if (!map) {
    initMap();
  }

  // 1. Aggregate data by region
  const regionStats = {};

  data.forEach((item) => {
    const region = item.departement; // Assuming 'departement' holds region name
    if (!region) return;

    const normalizedRegion = normalizeRegionName(region);

    if (!regionStats[normalizedRegion]) {
      regionStats[normalizedRegion] = {
        salaries: [],
        totals: [],
      };
    }

    const salary = parseSalaryRange(item.salaire_brut);
    if (salary > 0) {
      regionStats[normalizedRegion].salaries.push(salary);

      const prime = parsePrime(item.primes);
      regionStats[normalizedRegion].totals.push(salary + prime);
    }
  });

  // 2. Calculate stats
  const regionMetrics = {};

  const getStats = (arr) => {
    if (!arr || arr.length === 0) return { avg: 0, median: 0 };

    const sum = arr.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / arr.length);

    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 !== 0
        ? sorted[mid]
        : Math.round((sorted[mid - 1] + sorted[mid]) / 2);

    return { avg, median };
  };

  Object.keys(regionStats).forEach((key) => {
    const group = regionStats[key];
    const baseStats = getStats(group.salaries);
    const totalStats = getStats(group.totals);

    regionMetrics[key] = {
      avg: baseStats.avg,
      median: baseStats.median,
      avgTotal: totalStats.avg,
      medianTotal: totalStats.median,
      count: group.salaries.length,
    };
  });

  // 3. Update GeoJSON properties
  regionsData.features.forEach((feature) => {
    const name = normalizeRegionName(feature.properties.nom);

    // Try direct match first
    let stats = regionMetrics[name];

    // If not found, try to map known differences (optional, add if needed)
    // e.g. "paca" -> "provence alpes cote d azur"
    if (!stats) {
      // quick fix for common abbreviations if any
      if (
        name.includes("provence alpes cote d azur") &&
        regionMetrics["paca sud"]
      )
        stats = regionMetrics["paca sud"];
    }

    if (stats) {
      feature.properties.avgSalary = stats.avg;
      feature.properties.medianSalary = stats.median;
      feature.properties.avgTotal = stats.avgTotal;
      feature.properties.medianTotal = stats.medianTotal;
      feature.properties.count = stats.count;
    } else {
      feature.properties.avgSalary = null;
      feature.properties.medianSalary = null;
      feature.properties.avgTotal = null;
      feature.properties.medianTotal = null;
      feature.properties.count = 0;
    }
  });

  // 4. Redraw layer
  if (geoJsonLayer) {
    map.removeLayer(geoJsonLayer);
  }

  geoJsonLayer = L.geoJson(regionsData, {
    style: style,
    onEachFeature: onEachFeature,
  }).addTo(map);

  // Ensure legend is up to date (though mode didn't change, we want to ensure it's there)
  if (!legendControl) updateLegend();
}
