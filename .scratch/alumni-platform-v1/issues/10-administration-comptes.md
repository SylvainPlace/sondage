# 10 — Administrer les comptes et les accès

**What to build:** fournir aux administrateurs une vue et des actions sûres sur
les accès alumni, sans leur ouvrir les données professionnelles individuelles.

**Blocked by:** 04 — Gérer les sessions et la récupération d’accès.

**Status:** ready-for-agent

- [ ] Un administrateur récemment réauthentifié peut importer une whitelist et
      consulter les comptes éligibles, actifs, suspendus ou en suppression.
- [ ] L’import est idempotent, normalise les adresses et fournit ses compteurs
      ainsi que ses anomalies.
- [ ] L’administrateur peut suspendre ou réactiver un compte et la suspension
      invalide immédiatement ses sessions.
- [ ] Le changement d’adresse suit une vérification de la nouvelle adresse et
      ne crée pas de doublon.
- [ ] Les réponses administratives ne contiennent jamais de salaire, variable,
      avantage ou texte libre d’un relevé.
- [ ] Aucun contrat administrateur ne permet de modifier une activité ou un
      relevé appartenant à un alumni.
- [ ] Chaque action sensible est journalisée avec acteur, cible, date et
      résultat.
- [ ] Les contrôles de rôle et de réauthentification sont testés pour un alumni,
      un administrateur et une session ancienne.
