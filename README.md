# 📊 Observatoire des Salaires Alumni

Ce projet est une application web interactive permettant de visualiser et d'explorer les données salariales des anciens élèves (Alumni). Il présente des statistiques détaillées sur les rémunérations, filtrables par divers critères, et alimentées directement depuis un Google Sheet via un Cloudflare Worker.

## 🚀 Fonctionnalités

- **Tableau de bord statistique** : Affichage dynamique du salaire moyen, médian et du nombre de répondants.
- **Visualisations avancées** :
  - **Carte interactive (Leaflet)** : Répartition géographique des salaires et des alumni.
  - **Graphique Salaire vs Expérience** : Analyse de l'évolution salariale selon l'ancienneté.
  - **Distribution des salaires** : Histogramme interactif.
- **Système de filtres complet** :
  - Multicritères : Année de diplôme, Sexe, Expérience, Secteur, Type de structure, Localisation.
  - Mise à jour dynamique des résultats et des graphiques.
- **Section qualitative** : Liste des retours d'expérience, conseils et avantages (primes, télétravail, etc.).
- **Responsive Design** : Interface optimisée pour mobiles, tablettes et ordinateurs.

## 🛠️ Architecture Technique

Le projet est divisé en deux parties :

1.  **Frontend (Statique)** :
    *   `index.html` / `style.css` / `js/`
    *   Application Single Page (SPA) sans framework lourd.
    *   Utilise des modules ES6 (`type="module"`).
    *   Librairies : Chart.js (Graphiques), Leaflet (Cartes).

2.  **Backend (Serverless)** :
    *   Dossier `worker/`.
    *   **Cloudflare Worker** : Sert d'API intermédiaire.
    *   Récupère les données depuis un **Google Sheet** (via l'API Google Sheets).
    *   **Cache** : Les données sont mises en cache (10h) pour optimiser les performances et limiter les appels à Google.
    *   Normalisation des données (Régions, Secteurs, Expérience) côté serveur.

## 📂 Structure du projet

- **`index.html`** : Point d'entrée de l'application.
- **`style.css`** : Styles globaux, variables CSS, layout responsive.
- **`js/`** : Logique frontend modulaire.
  - `main.js` : Orchestration, chargement des données.
  - `filters.js` : Gestion des filtres et de l'UI de filtrage.
  - `charts.js` : Configuration et mise à jour des graphiques Chart.js.
  - `map.js` : Gestion de la carte Leaflet.
  - `utils.js` : Fonctions utilitaires (formatage monétaire, parsing).
- **`worker/`** : Code du Cloudflare Worker (`worker.js` et `wrangler.toml`).

## ⚙️ Installation et Développement Local

### Prérequis

- Un navigateur web moderne.
- Un serveur local simple (VS Code Live Server, Python http.server, etc.) est **indispensable** car l'application utilise des modules ES6 qui ne fonctionnent pas via l'ouverture directe du fichier (`file://`).

### Lancer le frontend

1.  Cloner le dépôt.
2.  Ouvrir le dossier dans votre éditeur (ex: VS Code).
3.  Lancer un serveur local :
    *   **Option 1 : Live Server (VS Code)** : Installez l'extension et cliquez sur "Go Live".
    *   **Option 2 : Python** : Ouvrez un terminal dans le dossier et lancez `python -m http.server 8000`. Ouvrez ensuite `http://localhost:8000` dans votre navigateur.
4.  L'application chargera les données depuis l'API de production (`https://sondage-api.sy-vain001.workers.dev/`) configurée dans `main.js`.

### Modifier le Worker (Backend)

Si vous souhaitez modifier la logique backend :
1.  Installez [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/).
2.  Configurez vos secrets (Google Service Account) via `wrangler secret put`.
3.  Testez localement avec `wrangler dev` dans le dossier `worker/`.
4.  **Déploiement Automatique** : Toute modification poussée sur le dépôt (dossier `worker/`) déclenche automatiquement le déploiement sur Cloudflare.

## 📦 Technologies utilisées

- **Frontend** : HTML5, CSS3, JavaScript (ES6+), Chart.js, Leaflet.
- **Backend** : Cloudflare Workers (JavaScript), Google Sheets API.
- **Outils** : Git, Wrangler (CLI Cloudflare).
