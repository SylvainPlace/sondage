# Panorama des Carrières Alumnis

Application de visualisation des données de carrière des alumni, construite avec Next.js et déployée sur Cloudflare Pages via OpenNext.

## 🚀 Technologies

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Runtime**: Cloudflare Workers (via [OpenNext](https://opennext.js.org/))
- **Langage**: TypeScript
- **Interface**: React 19, CSS Global
- **Visualisation**:
  - Cartographie : `react-leaflet` / Leaflet
  - Graphiques : `react-chartjs-2` / Chart.js
- **Données**: Google Sheets API
- **Authentification**: Mot de passe + Whitelist email (JWT)

## 🛠️ Prérequis

- Node.js 20 ou supérieur
- Un compte Cloudflare (pour le déploiement)
- Un projet Google Cloud avec l'API Google Sheets activée

## 📦 Installation

1. Cloner le dépôt :

   ```bash
   git clone <votre-repo-url>
   cd sondage
   ```

2. Installer les dépendances :

   ```bash
   npm install
   ```

3. Configurer les variables d'environnement. Créez un fichier `.env.local` à la racine :

   ```env
   # Authentification
   GLOBAL_PASSWORD=votre_mot_de_passe_global
   JWT_SECRET=une_chaine_aleatoire_secrete

   # Google Sheets API
   GCP_SERVICE_ACCOUNT_EMAIL=votre-service-account@project.iam.gserviceaccount.com
   GCP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   SPREADSHEET_ID=l_id_de_votre_google_sheet
   ```

   > **Note** : Pour `GCP_PRIVATE_KEY`, assurez-vous de bien inclure les sauts de ligne `\n` ou de mettre la clé entre guillemets si nécessaire selon votre OS.

## 💻 Développement Local

Lancer le serveur de développement Next.js classique :

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`.

## ☁️ Déploiement (Cloudflare Pages)

Ce projet utilise `@opennextjs/cloudflare` pour adapter Next.js au runtime Edge de Cloudflare.

### Déploiement automatique (Recommandé)

Utilisez le script configuré pour construire et déployer directement :

```bash
npm run deploy
```

Cela exécutera `opennextjs-cloudflare build` puis `opennextjs-cloudflare deploy`. Vous devrez vous connecter à votre compte Cloudflare la première fois (via Wrangler).

### Prévisualisation locale du build Cloudflare

Pour tester le comportement exact du build Cloudflare en local (Workerd) :

```bash
npm run preview
```

### Configuration Manuelle (CI/CD)

Si vous configurez le déploiement via le tableau de bord Cloudflare Pages (Git integration) :

1. **Build Command**: `npm run pages:build` (ou `npx @opennextjs/cloudflare build`)
2. **Build Output Directory**: `.open-next/assets` (Note: OpenNext change parfois cela, vérifiez `wrangler.json` ou la doc si le défaut `.vercel/output/static` ne fonctionne pas. Pour ce projet configuré avec `wrangler.json`, les assets statiques sont souvent gérés automatiquement par le worker).
3. **Compatibility Flags**: `nodejs_compat`
4. **Variables d'environnement**: Ajoutez toutes les variables définies dans `.env.local` dans les réglages de votre projet Cloudflare Pages.

## 📂 Structure du Projet

- `src/app`: Routes et pages Next.js (App Router).
- `src/app/api`: Routes API (Auth, Data proxy).
- `src/components`: Composants React réutilisables (Map, Charts, Filters).
- `src/lib`: Logique métier et utilitaires (Auth Google, JWT, Normalisation des données).
- `wrangler.json`: Configuration Cloudflare Workers.
- `open-next.config.ts`: Configuration spécifique à OpenNext.

## 🔐 Sécurité

- **Authentification** : L'accès est protégé par un mot de passe unique connu des alumni, puis vérifié contre une liste d'emails autorisés (whitelist) stockée dans le Google Sheet.
- **Données** : Les données sensibles sont chargées côté serveur (API Routes) et ne sont jamais exposées directement au client sans authentification.
