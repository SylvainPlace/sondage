# Déploiement du Backend Cloudflare Worker

Ce dossier contient le code pour un backend sécurisé qui agit comme proxy vers votre Google Sheet privé.

## 1. Prérequis Google Cloud
1.  Allez sur [Google Cloud Console](https://console.cloud.google.com/).
2.  Créez un projet (ou utilisez l'existant).
3.  Activez l'API **Google Sheets API**.
4.  Créez un **Service Account** (IAM & Admin > Service Accounts).
5.  Créez une **Clé JSON** pour ce Service Account et téléchargez-la.
6.  **IMPORTANT** : Ouvrez votre Google Sheet et partagez-le (bouton "Partager") avec l'email du Service Account (ex: `mon-bot@mon-projet.iam.gserviceaccount.com`). Donnez-lui le rôle "Lecteur".

## 2. Déploiement sur Cloudflare

### Option A : Via le Dashboard (Le plus simple)
1.  Allez sur [Cloudflare Workers](https://dash.cloudflare.com/?to=/:account/workers).
2.  Créez un nouveau Worker (ex: `sondage-api`).
3.  Cliquez sur **"Quick Edit"** et copiez-collez tout le contenu de `worker.js` dedans.
4.  Sauvegardez et Déployez.
5.  Allez dans **Settings > Variables**.
6.  Ajoutez les variables suivantes :
    *   `SPREADSHEET_ID` : L'ID de votre Google Sheet.
    *   `GCP_SERVICE_ACCOUNT_EMAIL` : L'email de votre service account (trouvé dans le JSON).
    *   `GCP_PRIVATE_KEY` : La clé privée complète (commence par `-----BEGIN PRIVATE KEY-----`). **Attention** : Copiez tout le contenu entre les guillemets dans le fichier JSON.

### Option B : Via CLI (Wrangler)
Si vous avez `npm` installé :
1.  `npm install -g wrangler`
2.  `wrangler login`
3.  `wrangler secret put GCP_PRIVATE_KEY` (collez la clé)
4.  `wrangler secret put GCP_SERVICE_ACCOUNT_EMAIL`
5.  `wrangler deploy`

## 3. Configuration du Frontend
Une fois déployé, récupérez l'URL de votre worker (ex: `https://sondage-api.votre-nom.workers.dev`).
Mettez à jour `js/main.js` avec cette URL.
