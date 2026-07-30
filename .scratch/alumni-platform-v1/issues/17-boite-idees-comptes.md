# 17 — Migrer la boîte à idées vers les comptes

**What to build:** déplacer la boîte à idées sur une page dédiée et sécuriser
la propriété des idées et votes avec l’identité de session plutôt qu’un email
fourni par le client.

**Blocked by:** 03 — Activer et connecter un alumni.

**Status:** ready-for-agent

- [ ] La boîte à idées est accessible depuis une page dédiée de la navigation
      authentifiée.
- [ ] La création d’une idée utilise l’identifiant du compte courant et ignore
      toute identité de propriétaire fournie par le client.
- [ ] Un compte ne peut voter qu’une fois par idée et peut retirer son vote.
- [ ] Seul l’auteur peut modifier ou supprimer son idée selon les règles
      fonctionnelles conservées.
- [ ] Les idées et votes existants sont associés aux comptes par email
      normalisé lorsque la correspondance est fiable.
- [ ] Les adresses sans correspondance sont consignées dans le rapport de
      migration sans création silencieuse de compte.
- [ ] Une idée dont l’auteur est supprimé affiche « Ancien membre » sans
      conserver son email.
- [ ] Les tests HTTP couvrent propriété, vote concurrent, visibilité et
      migration idempotente.
