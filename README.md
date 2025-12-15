# Panorama des Carrières Alumnis (Next.js Migration)

Application de visualisation des données de carrière des alumni, migrée vers Next.js pour hébergement sur Cloudflare Pages.

## Architecture

- **Framework**: Next.js 15 (App Router)
- **Langage**: TypeScript
- **Style**: CSS Global (porté de l'existant)
- **Composants**:
  - `Map.tsx`: Carte interactive (Leaflet)
  - `Charts.tsx`: Graphiques (Chart.js)
  - `Filters.tsx`: Filtres dynamiques
- **Backend**: API Routes Next.js (`src/app/api/`) exécutées sur le Edge Runtime.

## Développement Local

1. Installer les dépendances :
   ```bash
   npm install
   ```

2. Configurer les variables d'environnement dans `.env.local` (demandez à un admin pour les valeurs) :
   ```
   GLOBAL_PASSWORD=...
   JWT_SECRET=...
   GCP_SERVICE_ACCOUNT_EMAIL=...
   GCP_PRIVATE_KEY=...
   SPREADSHEET_ID=...
   ```

3. Lancer le serveur de développement :
   ```bash
   npm run dev
   ```

## Déploiement sur Cloudflare Pages

1. **Connecter le repository** Git à Cloudflare Pages.
2. **Configuration du Build** :
   - **Framework Preset**: Aucun (ou Next.js, mais vérifiez la commande)
   - **Build command**: `npm run pages:build` (ou `npx @cloudflare/next-on-pages`)
   - **Build output directory**: `.vercel/output/static`
   - **Node.js Version**: 20+ (Définir `NODE_VERSION` à `20` ou plus dans les variables d'env si nécessaire)

3. **Variables d'environnement** (Settings -> Environment Variables) :
   Ajoutez les mêmes variables que pour le développement local (`GLOBAL_PASSWORD`, etc.).

## Note sur la Base de Données
Les données proviennent d'un Google Sheet via l'API Google Sheets (Service Account).
L'authentification utilisateur est gérée par un mot de passe global et une whitelist d'emails (dans le Sheet).
