# 📊 Observatoire des Salaires Alumni

Ce projet est une application web interactive permettant de visualiser et d'explorer les données salariales des anciens élèves (Alumni). Il présente des statistiques détaillées sur les rémunérations, filtrables par divers critères (expérience, secteur, localisation, etc.).

## 🚀 Fonctionnalités

- **Tableau de bord statistique** : Affichage dynamique du salaire moyen, médian et du nombre de répondants.
- **Système de filtres avancés** :
  - Filtrage multicritères (Année de diplôme, Sexe, Expérience, Secteur, Type de structure, Département).
  - Menus déroulants personnalisés avec sélection multiple (checkboxes).
  - Mise à jour dynamique des compteurs d'options selon le contexte.
- **Visualisation de données** :
  - Graphique en barres (Histogramme) de la distribution des salaires.
  - Barres de progression pour les avantages les plus fréquents.
- **Section qualitative** : Liste des retours d'expérience et conseils des alumni.
- **Responsive Design** : Interface adaptée aux mobiles, tablettes et ordinateurs.

## 🛠️ Installation et Utilisation

Ce projet est une application **statique** (HTML/CSS/JS). Il ne nécessite pas de serveur backend (Node.js, PHP, etc.) pour fonctionner localement de manière basique, bien que l'utilisation d'un serveur local soit recommandée pour éviter les restrictions CORS liées au chargement du fichier JSON.

### Prérequis

- Un navigateur web moderne.
- (Optionnel mais recommandé) Une extension de "Live Server" ou un serveur local simple (Python, Node, etc.).

### Comment lancer le projet

1. **Cloner ou télécharger** le dépôt.
2. **Ouvrir le dossier** dans votre éditeur de code favori (ex: VS Code).
3. **Lancer un serveur local** :
   - *Méthode Python* : Ouvrez un terminal dans le dossier et lancez `python -m http.server 8000`. Ouvrez ensuite `http://localhost:8000` dans votre navigateur.
   - *Méthode VS Code* : Utilisez l'extension "Live Server" et cliquez sur "Go Live".
   - *Méthode simple* : Ouvrir directement `index.html` dans le navigateur (⚠️ **Attention** : cela peut bloquer le chargement des données `data.json` sur certains navigateurs à cause de la politique CORS).

## 📂 Structure du projet

- **`index.html`** : Structure de la page et conteneurs principaux.
- **`style.css`** : Feuilles de style, variables CSS, mise en page Grid/Flexbox et media queries.
- **`script.js`** : Logique de l'application :
  - Récupération des données (`fetch`).
  - Gestion des filtres et de l'état.
  - Calcul des statistiques (Moyenne, Médiane).
  - Génération des graphiques avec **Chart.js**.
- **`data.json`** : Base de données brute contenant les réponses au sondage.

## ⚙️ Technologies utilisées

- **HTML5 / CSS3** : Structure sémantique et design moderne (Inter font).
- **JavaScript (ES6+)** : Manipulation du DOM et logique métier sans framework lourd.
- **Chart.js** : Librairie externe utilisée pour le rendu des graphiques.
- **Google Fonts** : Police d'écriture *Inter*.

---
*Projet réalisé pour visualiser les résultats de l'enquête d'insertion professionnelle.*
