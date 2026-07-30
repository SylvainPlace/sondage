# 09 — Normaliser rémunérations, temps de travail et avantages

**What to build:** permettre des comparaisons fiables entre devises, quotités
de travail et avantages tout en conservant chaque déclaration originale.

**Blocked by:** 06 — Saisir une première activité et son relevé ; 07 — Gérer les
taxonomies et les valeurs « autre ».

**Status:** ready-for-agent

- [ ] Les montants fixe et variable sont conservés dans l’unité mineure et la
      devise saisie.
- [ ] Un variable nul est distingué d’un variable non renseigné.
- [ ] Le taux de change, sa date et sa source produisent une valeur annuelle en
      euros sans écraser l’original.
- [ ] La quotité ou durée de travail produit un équivalent temps plein distinct
      du montant réellement perçu.
- [ ] L’alumni peut renseigner organisation du travail et jours de télétravail.
- [ ] Les avantages initiaux acceptent leurs valeurs typées : jours, montant,
      pourcentage, présence ou texte.
- [ ] Les calculs refusent les devises, taux, quotités ou valeurs incohérents et
      explicitent toute conversion affichée.
- [ ] Les fonctions de conversion, d’arrondi et d’équivalent temps plein sont
      couvertes par des tests unitaires, puis par un scénario HTTP complet.
