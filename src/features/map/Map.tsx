"use client";

import L from "leaflet";
import { useCallback, useEffect, useMemo, useRef } from "react";

import "leaflet/dist/leaflet.css";
import { formatMoney } from "@/lib/frontend-utils";
import { MapRegionStats } from "@/types";
import styles from "./Map.module.css";

import type { FeatureCollection, GeoJsonObject } from "geojson";

interface MapProps {
  regions: Record<string, MapRegionStats>;
  mode: string;
}

// [Lightest -> Darkest]
const MAP_COLORS = ["#f5eacc", "#dec086", "#be9249", "#8a6322", "#5c4217"];

function normalizeRegionName(name: string) {
  if (!name) {
    return "";
  }
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateBreaks(values: number[]) {
  if (values.length === 0) {
    return [0, 0, 0, 0];
  }
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  if (min === max) {
    return [min, min, min, min];
  }
  const q1 = sorted[Math.floor(sorted.length * 0.2)];
  const q2 = sorted[Math.floor(sorted.length * 0.4)];
  const q3 = sorted[Math.floor(sorted.length * 0.6)];
  const q4 = sorted[Math.floor(sorted.length * 0.8)];
  return [q1, q2, q3, q4];
}

function hasSufficientData(stats?: MapRegionStats) {
  return !!stats && stats.count >= 3;
}

function getRegionValue(stats: MapRegionStats | undefined, mode: string) {
  if (!hasSufficientData(stats)) {
    return 0;
  }

  switch (mode) {
    case "avg_base":
      return stats?.avg ?? 0;
    case "median_base":
      return stats?.median ?? 0;
    case "avg_total":
      return stats?.avgTotal ?? 0;
    case "median_total":
      return stats?.medianTotal ?? 0;
    case "count":
      return stats?.count ?? 0;
    default:
      return 0;
  }
}

export default function Map({ regions, mode }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const legendControlRef = useRef<L.Control | null>(null);

  const geoJsonDataRef = useRef<FeatureCollection | null>(null);
  const isGeoJsonLoadingRef = useRef(false);

  const regionMetrics = useMemo(() => regions, [regions]);

  const currentValues = useMemo(() => {
    const values: number[] = [];
    for (const stats of Object.values(regionMetrics)) {
      const val = getRegionValue(stats, mode);
      if (val > 0) {
        values.push(val);
      }
    }
    return values;
  }, [mode, regionMetrics]);

  const currentBreaks = useMemo(
    () => calculateBreaks(currentValues),
    [currentValues],
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) {
      return;
    }

    const map = L.map(mapContainerRef.current).setView(
      [46.603354, 1.888334],
      6,
    );

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      },
    ).addTo(map);

    mapInstanceRef.current = map;

    // Lazy-load the GeoJSON so it doesn't inflate the main JS bundle.
    if (!geoJsonDataRef.current && !isGeoJsonLoadingRef.current) {
      isGeoJsonLoadingRef.current = true;
      fetch("/regions.geojson")
        .then((r) => {
          if (!r.ok) {
            throw new Error(`Failed to load regions.geojson: ${r.status}`);
          }
          return r.json();
        })
        .then((geo) => {
          if (
            geo &&
            geo.type === "FeatureCollection" &&
            Array.isArray(geo.features)
          ) {
            geoJsonDataRef.current = geo as FeatureCollection;
            renderGeoJsonLayer();
          }
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
          isGeoJsonLoadingRef.current = false;
        });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getColor = useCallback(
    (d: number | null | undefined) => {
      if (d === undefined || d === null) {
        return "#f0f0f0";
      }
      if (d > currentBreaks[3]) {
        return MAP_COLORS[4];
      }
      if (d > currentBreaks[2]) {
        return MAP_COLORS[3];
      }
      if (d > currentBreaks[1]) {
        return MAP_COLORS[2];
      }
      if (d > currentBreaks[0]) {
        return MAP_COLORS[1];
      }
      return MAP_COLORS[0];
    },
    [currentBreaks],
  );

  const style = useCallback(
    (feature?: GeoJSON.Feature) => {
      const props = feature?.properties as
        | Record<string, unknown>
        | null
        | undefined;
      const name = normalizeRegionName(props?.nom ? String(props.nom) : "");
      const stats =
        regionMetrics[name] ??
        (name.includes("provence alpes cote d azur")
          ? regionMetrics["paca sud"]
          : undefined);

      const value = getRegionValue(stats, mode);

      const color = value ? getColor(value) : "#f0f0f0";

      return {
        fillColor: color,
        weight: 2,
        opacity: 1,
        color: "white",
        dashArray: "3",
        fillOpacity: 0.7,
      };
    },
    [getColor, mode, regionMetrics],
  );

  const highlightFeature = useCallback((e: L.LeafletMouseEvent) => {
    const layer = e.target as unknown as L.Path;
    layer.setStyle({
      weight: 3,
      color: "#666",
      dashArray: "",
      fillOpacity: 0.9,
    });
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
  }, []);

  const resetHighlight = useCallback((e: L.LeafletMouseEvent) => {
    if (!geoJsonLayerRef.current) {
      return;
    }
    geoJsonLayerRef.current.resetStyle(e.target as unknown as L.Path);
  }, []);

  const onEachFeature = useCallback(
    (feature: GeoJSON.Feature, layer: L.Layer) => {
      layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
      });

      const props = feature.properties as
        | Record<string, unknown>
        | null
        | undefined;
      const nom = props?.nom ? String(props.nom) : "";
      if (!nom) {
        return;
      }

      const normalized = normalizeRegionName(nom);
      const stats =
        regionMetrics[normalized] ??
        (normalized.includes("provence alpes cote d azur")
          ? regionMetrics["paca sud"]
          : undefined);

      let content = `<strong>${nom}</strong><br/>`;
      if (stats && hasSufficientData(stats)) {
        content += `Moyen: ${formatMoney(stats.avg)}<br/>`;
        content += `Médian: ${formatMoney(stats.median)}<br/>`;
        content += `Moyen (+Primes): ${formatMoney(stats.avgTotal)}<br/>`;
        content += `Médian (+Primes): ${formatMoney(stats.medianTotal)}<br/>`;
        content += `Répondants: ${stats.count}`;
      } else {
        content += "Données insuffisantes";
      }
      layer.bindTooltip(content);
    },
    [highlightFeature, regionMetrics, resetHighlight],
  );

  // Use a separate effect to update layer when breaks change (triggered by state update in updateMapData)
  const updateLegend = useCallback(() => {
    if (!mapInstanceRef.current) {
      return;
    }
    if (legendControlRef.current) {
      legendControlRef.current.remove();
    }

    const legend = new L.Control({ position: "bottomright" });
    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend");
      div.className += ` ${styles.legend}`;
      let title = "Salaire";
      if (mode === "count") {
        title = "Répondants";
      } else if (mode.includes("median")) {
        title = "Salaire Médian";
      } else {
        title = "Salaire Moyen";
      }
      if (mode.includes("total")) {
        title += " (+ Primes)";
      }

      div.innerHTML += `<div class="${styles.legendTitle}">${title}</div>`;
      const fmt = (v: number) => (mode === "count" ? v : formatMoney(v));

      div.innerHTML +=
        `<i class="${styles.legendIcon}" style="background:${MAP_COLORS[0]}"></i> ` +
        "&lt; " +
        fmt(currentBreaks[0]) +
        "<br>";

      for (let i = 0; i < 3; i++) {
        div.innerHTML +=
          `<i class="${styles.legendIcon}" style="background:${MAP_COLORS[i + 1]}"></i> ` +
          fmt(currentBreaks[i]) +
          " &ndash; " +
          fmt(currentBreaks[i + 1]) +
          "<br>";
      }
      div.innerHTML +=
        `<i class="${styles.legendIcon}" style="background:${MAP_COLORS[4]}"></i> ` +
        "&gt; " +
        fmt(currentBreaks[3]) +
        "<br>";

      return div;
    };

    legend.addTo(mapInstanceRef.current);
    legendControlRef.current = legend;
  }, [currentBreaks, mode]);

  const renderGeoJsonLayer = useCallback(() => {
    const map = mapInstanceRef.current;
    const geo = geoJsonDataRef.current;
    if (!map || !geo) {
      return;
    }

    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }

    geoJsonLayerRef.current = L.geoJSON(geo as unknown as GeoJsonObject, {
      style,
      onEachFeature,
    }).addTo(map);

    updateLegend();
  }, [onEachFeature, style, updateLegend]);

  useEffect(() => {
    renderGeoJsonLayer();
  }, [renderGeoJsonLayer]);

  return (
    <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />
  );
}
