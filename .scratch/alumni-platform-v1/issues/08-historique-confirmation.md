# 08 — Historiser les activités et confirmer la situation actuelle

**What to build:** représenter un parcours longitudinal avec plusieurs
activités, plusieurs relevés et une confirmation de situation sans duplication.

**Blocked by:** 06 — Saisir une première activité et son relevé.

**Status:** ready-for-agent

- [ ] L’alumni peut ouvrir plusieurs activités simultanées.
- [ ] Au plus une activité ouverte est marquée principale et le changement est
      transactionnel.
- [ ] Une évolution de conditions ajoute un relevé à l’activité existante.
- [ ] Un changement de métier ou d’organisation employeuse clôture l’activité
      précédente et permet d’en ouvrir une nouvelle.
- [ ] Une confirmation « rien n’a changé » met à jour la fraîcheur sans créer
      de relevé supplémentaire.
- [ ] La situation actuelle est dérivée du dernier relevé ou de la dernière
      confirmation d’une activité ouverte.
- [ ] Les états récent, « à confirmer » et historique respectent exactement les
      seuils de douze et trente-six mois.
- [ ] Les tests couvrent activités simultanées, concurrence sur l’activité
      principale, relevés successifs et confirmation répétée.
