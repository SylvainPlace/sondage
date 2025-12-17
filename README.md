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

## 🔧 Scripts Disponibles

### Développement

- `npm run dev` : Lance le serveur de développement Next.js

### Qualité du code

- `npm run lint` : Vérifie les erreurs ESLint
- `npm run lint:fix` : Corrige automatiquement les erreurs ESLint
- `npm run typecheck` : Vérifie les types TypeScript
- `npm run format` : Formate le code avec Prettier
- `npm run format:check` : Vérifie le formatage sans modifier
- `npm run check` : Exécute toutes les vérifications (lint, typecheck, test, format)
- `npm run check:fix` : Corrige automatiquement lint et formatage

### Tests

- `npm run test` : Exécute les tests unitaires
- `npm run test:watch` : Lance les tests en mode watch

### Déploiement

- `npm run pages:build` : Construit pour Cloudflare Pages
- `npm run preview` : Prévisualise le build Cloudflare en local
- `npm run deploy` : Construit et déploie sur Cloudflare Pages

**Hooks Git (Husky)** : Un hook pre-commit est configuré pour exécuter automatiquement toutes les vérifications de qualité (`npm run check`) avant chaque commit.

Si un commit échoue à cause d'erreurs de qualité du code :

- Utilisez `npm run check:fix` pour corriger automatiquement la plupart des problèmes (linting et formatage)
- Utilisez `npm run check` pour voir tous les détails des erreurs restantes
- Une fois les problèmes résolus, vous pourrez committer normalement

## 💻 Développement Local

Lancer le serveur de développement Next.js classique :

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`.

## ☁️ Déploiement (Cloudflare Workers)

Ce projet utilise `@opennextjs/cloudflare` pour adapter Next.js au runtime Edge de Cloudflare Workers.

Le déploiement est entièrement automatisé via l'intégration Git de Cloudflare Workers. Chaque push sur la branche principale trigger automatiquement un pipeline de déploiement qui exécute les commandes de build configurées.

### Déploiement automatique (Par défaut)

Le déploiement se fait automatiquement lors de chaque push sur la branche principale via Cloudflare Workers. Le pipeline exécute :

1. **Build Command**: `npm run pages:build`
2. **Worker Setup**: Configuration du runtime Workers avec OpenNext
3. **Deployment**: Mise en production automatique sur Cloudflare Workers

### Déploiement manuel

Pour déployer manuellement si nécessaire :

```bash
npm run deploy
```

Cela exécutera `opennextjs-cloudflare build` puis `opennextjs-cloudflare deploy`. Vous devrez vous connecter à votre compte Cloudflare la première fois (via Wrangler).

### Prévisualisation locale du build Cloudflare

Pour tester le comportement exact du build Cloudflare en local (Workerd) :

```bash
npm run preview
```

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
