import type { D1Database } from "@cloudflare/workers-types";

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    IMAGES: {
      get: (key: string) => Promise<ArrayBuffer | null>;
      put: (key: string, value: ArrayBuffer) => Promise<void>;
      delete: (key: string) => Promise<void>;
    };
    ASSETS: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    };
    NEXTJS_ENV: string;
    FIREBASE_PROJECT_ID: string;
    FIREBASE_CLIENT_EMAIL: string;
    FIREBASE_PRIVATE_KEY: string;
    RESEND_API_KEY: string;
    TURNSTILE_SECRET_KEY: string;
  }
}
