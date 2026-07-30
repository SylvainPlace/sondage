# 06 — Saisir une première activité et son relevé

**What to build:** offrir un premier parcours complet permettant à l’alumni de
décrire une activité professionnelle et ses conditions actuelles en euros à
temps plein.

**Blocked by:** 05 — Compléter le profil alumni.

**Status:** ready-for-agent

- [ ] L’alumni peut créer une activité avec relation de travail, domaine
      professionnel, métier, intitulé de poste, secteur d’activité, pays
      d’emploi et date de début facultative.
- [ ] Le premier relevé enregistre une date d’observation modifiable,
      initialisée au jour de la saisie.
- [ ] Le premier relevé accepte un salaire fixe, un variable connu ou inconnu
      et les conditions minimales d’un temps plein en euros.
- [ ] Le cockpit ou l’espace de contribution restitue immédiatement l’activité
      et son relevé après création.
- [ ] L’alumni peut corriger puis supprimer uniquement ses propres données.
- [ ] Les champs non pertinents pour une relation de travail ne sont pas rendus
      artificiellement obligatoires.
- [ ] Les entrées inconnues sont refusées et aucune propriété de compte fournie
      par le client n’est utilisée comme autorité.
- [ ] Les tests HTTP couvrent le parcours heureux, les validations et les
      tentatives de lecture ou modification par un autre compte.
