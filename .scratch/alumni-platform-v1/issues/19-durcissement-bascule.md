# 19 — Durcir et basculer la V1

**What to build:** transformer les tranches validées en une version déployable,
observable et réversible qui remplace réellement l’application historique.

**Blocked by:** 11 — Importer le sondage historique ; 13 — Construire le cockpit
personnel ; 14 — Construire l’explorateur ; 15 — Automatiser invitations et
rappels ; 16 — Administrer et reclasser les taxonomies ; 17 — Migrer la boîte à
idées vers les comptes ; 18 — Supprimer et anonymiser un compte.

**Status:** ready-for-agent

- [ ] Les parcours navigateur validés couvrent activation et connexion,
      contribution et confirmation, cockpit et explorateur, confidentialité et
      opérations administratives essentielles.
- [ ] Les limites de débit, protections CSRF, en-têtes de sécurité, réponses
      neutres et journaux d’événements sensibles sont revus avant bascule.
- [ ] Le build OpenNext expose le gestionnaire HTTP et le traitement planifié
      dans l’environnement de préproduction.
- [ ] Un export de sauvegarde est réalisé avant toute migration de production
      et la procédure de restauration est testée.
- [ ] Les distributions et agrégats importés sont comparés à la référence et
      le rapport de reprise est approuvé.
- [ ] Une courte recette de double lecture confirme les résultats sans fusion
      silencieuse des sources.
- [ ] Le mot de passe collectif, les JWT du navigateur et la lecture Google
      Sheets sont retirés après validation de la bascule.
- [ ] Les anciennes sources restent en lecture seule pendant la période de
      retour arrière convenue.
- [ ] Aucun secret réel ni identifiant de ressource inventé n’est stocké dans
      le dépôt.
- [ ] Lint, types, tests, formatage, migrations, build Cloudflare et contrôle
      visuel passent sur la version candidate.
