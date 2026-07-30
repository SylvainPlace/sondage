# ADR 0001 — D1 comme source de vérité applicative

- Statut : accepté
- Date : 2026-07-30

## Contexte

L’application actuelle lit les réponses du sondage dans Google Sheets et
conserve les idées dans une base D1 séparée. Les anciennes réponses sont
anonymes et ne peuvent pas être rattachées de manière fiable aux adresses email
de la liste alumni. Le nouveau produit doit gérer des comptes, un historique
professionnel, des consentements et des statistiques, sans coût récurrent.

## Décision

Une nouvelle base Cloudflare D1 devient la source de vérité de l’application.
Elle contient les comptes métier, profils, activités, relevés, taxonomies,
consentements, files d’emails, idées et journaux d’administration.

Les anciennes réponses sont importées une seule fois comme données anonymes,
immuables et rattachées à un lot d’import. Elles ne sont jamais attribuées à un
compte. Google Sheets reste une archive externe en lecture seule après la
recette de l’import.

## Conséquences

- Les lectures de production ne dépendent plus de Google Sheets.
- L’import doit être reproductible, contrôlé par empreinte et accompagné d’un
  rapport d’anomalies.
- Les données historiques et actuelles restent séparées dans le stockage et
  dans les restitutions.
- La migration des idées remplace les emails par des identifiants de compte.
- Une période de comparaison avant bascule et une sauvegarde D1 sont requises.

## Alternatives écartées

- Continuer à lire Google Sheets : dépendance externe, modèle insuffisant et
  absence de transactions entre les domaines.
- Rattacher automatiquement les anciennes réponses : aucune clé fiable ne
  permet de le faire sans risque d’erreur ou d’atteinte à la confidentialité.
- Maintenir plusieurs bases D1 fonctionnelles : complexifie les transactions,
  les sauvegardes et les suppressions de compte sans bénéfice à cette échelle.
