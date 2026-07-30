# 15 — Automatiser invitations et rappels

**What to build:** permettre à l’administration de programmer et superviser des
emails automatiques tout en réservant le quota nécessaire aux messages
transactionnels.

**Blocked by:** 08 — Historiser les activités et confirmer la situation
actuelle ; 10 — Administrer les comptes et les accès.

**Status:** ready-for-agent

- [ ] L’administration peut programmer des invitations aux comptes non activés
      et au plus une relance facultative.
- [ ] Les rappels sont dérivés de la fraîcheur, des préférences de l’alumni et
      des échéances configurées.
- [ ] Les plafonds quotidiens des invitations et rappels sont distincts.
- [ ] Une réserve configurable empêche ces campagnes de consommer le quota
      destiné à l’activation, la récupération et le changement d’adresse.
- [ ] L’administration voit les emails éligibles, futurs, envoyés, réessayés,
      échoués ou annulés.
- [ ] Les campagnes et rappels peuvent être mis en pause puis repris sans
      doublon.
- [ ] Le traitement planifié réserve de petits lots idempotents et applique un
      backoff aux erreurs transitoires.
- [ ] Une configuration active envoie les lots sans validation manuelle.
- [ ] Les tests contrôlent priorité, quotas, réserve, idempotence, pause et
      journalisation avec un double Resend.
