# 04 — Gérer les sessions et la récupération d’accès

**What to build:** donner à l’alumni le contrôle de ses appareils connectés et
de la récupération de son accès, tout en imposant une réauthentification pour
les opérations sensibles.

**Blocked by:** 03 — Activer et connecter un alumni.

**Status:** ready-for-agent

- [ ] Une session active glisse jusqu’à quinze mois après la dernière activité
      et n’écrit sa nouvelle échéance qu’une fois par fenêtre de vingt-quatre
      heures.
- [ ] L’alumni peut consulter ses sessions avec un libellé d’appareil et leur
      dernière activité, sans exposer le jeton.
- [ ] L’alumni peut révoquer la session courante, une autre session ou toutes
      ses sessions.
- [ ] Une session expirée, révoquée, suspendue ou liée à un compte supprimé est
      rejetée à la prochaine requête.
- [ ] La récupération du mot de passe exige une nouvelle preuve de contrôle de
      l’adresse et ne révèle pas l’existence d’un compte.
- [ ] Le changement d’adresse, la suppression du compte et l’accès
      administrateur exigent une authentification Firebase récente.
- [ ] Les mutations authentifiées vérifient l’origine et une protection CSRF
      explicite.
- [ ] Les tests HTTP couvrent expiration exacte, glissement, révocation,
      suspension, récupération et réauthentification trop ancienne.
