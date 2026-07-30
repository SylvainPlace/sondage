# 12 — Produire des agrégats confidentiels

**What to build:** fournir au cockpit et à l’explorateur des statistiques
actuelles et historiques utiles sans permettre l’accès à une contribution
individuelle.

**Blocked by:** 08 — Historiser les activités et confirmer la situation
actuelle ; 09 — Normaliser rémunérations, temps de travail et avantages ; 11 —
Importer le sondage historique.

**Status:** ready-for-agent

- [ ] Le contrat statistique accepte uniquement des dimensions, mesures,
      périodes et combinaisons de filtres placées sur liste blanche.
- [ ] Tous les filtres sont appliqués avant de compter les alumni distincts.
- [ ] Un segment de deux alumni actuels ou moins retourne un résultat masqué,
      même si ces personnes possèdent plusieurs relevés.
- [ ] Un segment de trois alumni distincts devient visible avec sa taille
      d’échantillon.
- [ ] Entre trois et sept profils récents, actuel et historique sont retournés
      séparément avec un avertissement.
- [ ] À huit profils récents, l’actuel devient la référence principale et
      l’historique reste une comparaison.
- [ ] Les agrégats fournissent médiane, moyenne arrondie, rémunération totale et
      évolution sans renvoyer les relevés sources.
- [ ] Les facettes rares, tranches et filtres voisins empêchent les différences
      les plus évidentes et les réponses interdisent le cache partagé.
- [ ] Les jeux de test couvrent précisément 2, 3, 7 et 8 alumni, plusieurs
      relevés par personne et des filtres quasi identiques.
