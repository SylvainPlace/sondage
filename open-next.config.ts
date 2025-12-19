// default open-next.config.ts file created by @opennextjs/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";

export default defineCloudflareConfig({
  // Le cache est géré via notre implémentation personnalisée
  // Voir src/lib/cache-utils.ts et src/app/api/data/route.ts
  // pour la configuration du cache Cloudflare KV et Cache API
});
