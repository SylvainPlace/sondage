"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { regionsData } from "@/lib/regions-data";
import { formatMoney, parsePrime, parseSalaryRange } from "@/lib/frontend-utils";

interface MapProps {
  data: any[];
  mode: string;
}

// [Lightest -> Darkest]
const MAP_COLORS = ["#f5eacc", "#dec086", "#be9249", "#8a6322", "#5c4217"];

export default function Map({ data, mode }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const legendControlRef = useRef<L.Control | null>(null);
  const [currentBreaks, setCurrentBreaks] = useState<number[]>([0, 0, 0, 0]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current).setView([46.603354, 1.888334], 6);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    updateMapData();
  }, [data, mode]); // Re-run when data or mode changes

  // Update breaks when data/mode changes, but we do it inside updateMapData to synchronize with layer style update.

  function getColor(d: number) {
    if (d === undefined || d === null) return "#f0f0f0";
    if (d > currentBreaks[3]) return MAP_COLORS[4];
    if (d > currentBreaks[2]) return MAP_COLORS[3];
    if (d > currentBreaks[1]) return MAP_COLORS[2];
    if (d > currentBreaks[0]) return MAP_COLORS[1];
    return MAP_COLORS[0];
  }

  function style(feature: any) {
    const props = feature.properties;
    let value = 0;

    switch (mode) {
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

    const color = value ? getColor(value) : "#f0f0f0";

    return {
      fillColor: color,
      weight: 2,
      opacity: 1,
      color: "white",
      dashArray: "3",
      fillOpacity: 0.7,
    };
  }

  function onEachFeature(feature: any, layer: L.Layer) {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
    });

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

  function highlightFeature(e: L.LeafletMouseEvent) {
    const layer = e.target;
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

  function resetHighlight(e: L.LeafletMouseEvent) {
    if (geoJsonLayerRef.current) {
        geoJsonLayerRef.current.resetStyle(e.target);
    }
  }

  function normalizeRegionName(name: string) {
    if (!name) return "";
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function calculateBreaks(values: number[]) {
    if (!values || values.length === 0) return [0, 0, 0, 0];
    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    if (min === max) return [min, min, min, min];
    const q1 = sorted[Math.floor(sorted.length * 0.2)];
    const q2 = sorted[Math.floor(sorted.length * 0.4)];
    const q3 = sorted[Math.floor(sorted.length * 0.6)];
    const q4 = sorted[Math.floor(sorted.length * 0.8)];
    return [q1, q2, q3, q4];
  }

  function updateMapData() {
    // Process data
    const regionStats: any = {};
    data.forEach((item) => {
      const region = item.departement; 
      
      if (!region) return;
      const normalizedRegion = normalizeRegionName(region);

      if (!regionStats[normalizedRegion]) {
        regionStats[normalizedRegion] = { salaries: [], totals: [] };
      }

      const salary = parseSalaryRange(item.salaire_brut);
      if (salary > 0) {
        regionStats[normalizedRegion].salaries.push(salary);
        const prime = parsePrime(item.primes);
        regionStats[normalizedRegion].totals.push(salary + prime);
      }
    });

    const regionMetrics: any = {};
    Object.keys(regionStats).forEach((key) => {
      const group = regionStats[key];
      const getStats = (arr: number[]) => {
        if (!arr.length) return { avg: 0, median: 0 };
        const sum = arr.reduce((a, b) => a + b, 0);
        const avg = Math.round(sum / arr.length);
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
        return { avg, median };
      };
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

    const currentValues: number[] = [];
    // Update GeoJSON properties
    (regionsData as any).features.forEach((feature: any) => {
      const name = normalizeRegionName(feature.properties.nom);
      let stats = regionMetrics[name];
      if (!stats) {
        if (name.includes("provence alpes cote d azur") && regionMetrics["paca sud"]) stats = regionMetrics["paca sud"];
      }
      if (stats) {
        feature.properties.avgSalary = stats.avg;
        feature.properties.medianSalary = stats.median;
        feature.properties.avgTotal = stats.avgTotal;
        feature.properties.medianTotal = stats.medianTotal;
        feature.properties.count = stats.count;

        let val = 0;
        switch (mode) {
            case "avg_base": val = stats.avg; break;
            case "median_base": val = stats.median; break;
            case "avg_total": val = stats.avgTotal; break;
            case "median_total": val = stats.medianTotal; break;
            case "count": val = stats.count; break;
        }
        if (val > 0) currentValues.push(val);
      } else {
        feature.properties.avgSalary = null;
        feature.properties.medianSalary = null;
        feature.properties.avgTotal = null;
        feature.properties.medianTotal = null;
        feature.properties.count = 0;
      }
    });

    const breaks = calculateBreaks(currentValues);
    setCurrentBreaks(breaks);
  }
  
  // Use a separate effect to update layer when breaks change (triggered by state update in updateMapData)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (geoJsonLayerRef.current) {
        mapInstanceRef.current.removeLayer(geoJsonLayerRef.current);
    }

    geoJsonLayerRef.current = L.geoJSON(regionsData as any, {
        style: style,
        onEachFeature: onEachFeature
    }).addTo(mapInstanceRef.current);
    
    updateLegend();
  }, [currentBreaks, mode]); // Re-render layer when breaks (data processed) or mode changes.

  function updateLegend() {
    if (legendControlRef.current) {
        legendControlRef.current.remove();
    }

    const legend = new L.Control({ position: "bottomright" });

    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend");
      let title = "Salaire";
      if (mode === "count") title = "Répondants";
      else if (mode.includes("median")) title = "Salaire Médian";
      else title = "Salaire Moyen";
      if (mode.includes("total")) title += " (+ Primes)";

      div.innerHTML += `<h4>${title}</h4>`;
      const fmt = (v: number) => (mode === "count" ? v : formatMoney(v));

      div.innerHTML +=
        '<i style="background:' + MAP_COLORS[0] + '"></i> ' +
        "&lt; " + fmt(currentBreaks[0]) + "<br>";

      for (let i = 0; i < 3; i++) {
        div.innerHTML +=
          '<i style="background:' + MAP_COLORS[i + 1] + '"></i> ' +
          fmt(currentBreaks[i]) + " &ndash; " + fmt(currentBreaks[i + 1]) + "<br>";
      }
      div.innerHTML +=
        '<i style="background:' + MAP_COLORS[4] + '"></i> ' +
        "&gt; " + fmt(currentBreaks[3]) + "<br>";

      return div;
    };

    legend.addTo(mapInstanceRef.current!);
    legendControlRef.current = legend;
  }

  return <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />;
}
