import type { D1Database } from "@cloudflare/workers-types";

declare global {
  interface CloudflareEnv {
    IDEAS_DB: D1Database;
    IMAGES: {
      get: (key: string) => Promise<ArrayBuffer | null>;
      put: (key: string, value: ArrayBuffer) => Promise<void>;
      delete: (key: string) => Promise<void>;
    };
    ASSETS: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    };
    NEXTJS_ENV: string;
    GLOBAL_PASSWORD: string;
    JWT_SECRET: string;
    GCP_SERVICE_ACCOUNT_EMAIL: string;
    GCP_PRIVATE_KEY: string;
    SPREADSHEET_ID: string;
  }
}