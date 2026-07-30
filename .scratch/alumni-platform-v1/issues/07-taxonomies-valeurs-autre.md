# 07 — Gérer les taxonomies et les valeurs « autre »

**What to build:** rendre les domaines professionnels, métiers, secteurs
d’activité et avantages cohérents tout en permettant aux alumni de proposer
une valeur absente sans classification silencieuse.

**Blocked by:** 06 — Saisir une première activité et son relevé.

**Status:** ready-for-agent

- [ ] Les catégories actives sont servies avec des identifiants stables, un
      ordre déterministe et leur relation parent-enfant.
- [ ] La sélection d’un domaine professionnel limite les métiers proposés sans
      confondre métier et intitulé de poste.
- [ ] La nature de l’organisation et son secteur d’activité restent des
      dimensions indépendantes, notamment pour les organismes publics de santé.
- [ ] Une valeur « autre » conserve exactement le texte saisi et crée une
      proposition de qualification.
- [ ] Une correspondance approchante est présentée comme suggestion et exige
      une confirmation explicite de l’alumni.
- [ ] Une suggestion refusée ne modifie ni la valeur brute ni la catégorie
      « autre ».
- [ ] Les aliases exacts produisent un résultat déterministe et les catégories
      archivées ne sont plus proposées aux nouveaux relevés.
- [ ] Les comportements de sélection et de proposition sont testés par les
      contrats HTTP et par le formulaire.
