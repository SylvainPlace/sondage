// Cloudflare Cache Utilities
// Utilitaires pour gérer le cache avec Cloudflare KV et Cache API

import { NextResponse } from "next/server";

// Interface pour les options de cache
export interface CacheOptions {
  ttl?: number; // Time to live en secondes
  cacheControl?: string; // Header Cache-Control personnalisé
}

// Déclaration du type pour DATA_CACHE (Cloudflare KV)
interface CloudflareKV {
  get: (
    key: string,
    type?: "json" | "text" | "arrayBuffer",
  ) => Promise<unknown>;
  put: (
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ) => Promise<void>;
}

declare const DATA_CACHE: CloudflareKV;

// Fonction pour obtenir des données du cache
export async function getCache(key: string): Promise<unknown | null> {
  try {
    // Essayer d'abord avec Cloudflare KV (si disponible)
    if (typeof DATA_CACHE !== "undefined") {
      const cacheData = await DATA_CACHE.get(key, "json");
      if (cacheData) {
        return cacheData;
      }
    }

    // Sinon, essayer avec Cache API (pour les environnements sans KV)
    if (typeof caches !== "undefined") {
      const cache = await caches.open("data-cache");
      const response = await cache.match(key);
      if (response) {
        return await response.json();
      }
    }

    return null;
  } catch (error) {
    console.error("Erreur lors de la lecture du cache:", error);
    return null;
  }
}

// Fonction pour stocker des données dans le cache
export async function setCache(
  key: string,
  data: unknown,
  options: CacheOptions = {},
): Promise<void> {
  try {
    const ttl = options.ttl || 3600; // 1 heure par défaut
    const cacheControl =
      options.cacheControl || `public, max-age=${ttl}, s-maxage=${ttl}`;

    // Stocker dans Cloudflare KV (si disponible)
    if (typeof DATA_CACHE !== "undefined") {
      await DATA_CACHE.put(key, JSON.stringify(data), { expirationTtl: ttl });
    }

    // Stocker aussi dans Cache API pour la compatibilité
    if (typeof caches !== "undefined") {
      const cache = await caches.open("data-cache");
      const response = new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": cacheControl,
        },
      });
      await cache.put(key, response);
    }
  } catch (error) {
    console.error("Erreur lors de l'écriture dans le cache:", error);
  }
}

// Fonction pour créer une réponse avec cache
export function createCachedResponse(
  data: unknown,
  options: CacheOptions = {},
): NextResponse {
  const ttl = options.ttl || 3600;
  const cacheControl =
    options.cacheControl || `public, max-age=${ttl}, s-maxage=${ttl}`;

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": cacheControl,
      "X-Cache": "MISS",
      "Content-Type": "application/json",
    },
  });
}

// Fonction pour créer une réponse depuis le cache
export function createHitResponse(data: unknown): NextResponse {
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "X-Cache": "HIT",
      "Content-Type": "application/json",
    },
  });
}

// Fonction pour générer une clé de cache unique
export function generateCacheKey(
  prefix: string,
  params: Record<string, unknown> = {},
): string {
  const paramString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return `${prefix}:${paramString}`;
}
