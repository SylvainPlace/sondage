# 11 — Importer le sondage historique

**What to build:** reprendre une copie anonyme et immuable de l’ancien sondage
avec une provenance vérifiable et des résultats comparables à l’application
existante.

**Blocked by:** 07 — Gérer les taxonomies et les valeurs « autre » ; 09 —
Normaliser rémunérations, temps de travail et avantages.

**Status:** ready-for-agent

- [ ] Un fichier source produit un lot identifié par son nom, sa date et son
      empreinte SHA-256.
- [ ] Un second import de la même empreinte ne duplique aucune réponse.
- [ ] Chaque ligne conserve ses valeurs brutes et les valeurs normalisées
      nécessaires aux analyses.
- [ ] Les anciennes tranches de rémunération conservent leur libellé et une
      valeur représentative documentée lorsqu’un calcul l’exige.
- [ ] Aucune réponse historique ne possède de relation vers un compte alumni.
- [ ] Le rapport distingue lignes importées, ignorées et invalides avec les
      raisons nécessaires à la correction.
- [ ] Les effectifs, distributions et principaux agrégats sont comparés aux
      résultats de référence avant validation du lot.
- [ ] Des fixtures couvrent aliases, valeurs inconnues, montants invalides,
      doublons et import reproductible.
