/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    IDEAS_DB: D1Database;
  }
}

export {};
