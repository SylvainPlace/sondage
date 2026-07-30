# 16 — Administrer et reclasser les taxonomies

**What to build:** permettre aux administrateurs de faire évoluer les
catégories et de traiter les propositions « autre » sans perdre les valeurs
brutes ni appliquer de changement non audité.

**Blocked by:** 07 — Gérer les taxonomies et les valeurs « autre » ; 10 —
Administrer les comptes et les accès.

**Status:** ready-for-agent

- [ ] L’administration peut filtrer les propositions en attente par type de
      taxonomie.
- [ ] Une proposition peut être rattachée à une catégorie, créer une nouvelle
      catégorie, rester non statistique ou être rejetée.
- [ ] Les libellés et aliases peuvent évoluer sans changer l’identifiant stable
      d’une catégorie.
- [ ] Une catégorie peut être archivée sans casser les relevés historiques qui
      la référencent.
- [ ] Une reclassification rétroactive affiche le nombre et les exemples
      non sensibles de valeurs concernées avant confirmation.
- [ ] La confirmation est transactionnelle et journalise ancienne catégorie,
      nouvelle catégorie, acteur, date et raison.
- [ ] Une opération d’annulation restaure la classification précédente sans
      supprimer le journal.
- [ ] Les contrats administratifs respectent rôle et réauthentification et ne
      renvoient aucune rémunération individuelle.
