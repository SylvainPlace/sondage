# 01 — Stabiliser le socle D1 et la frontière de test API

**What to build:** rendre le socle de la nouvelle plateforme reproductible et
vérifiable localement, afin que chaque tranche suivante puisse tester ses
contrats HTTP contre une vraie base D1 sans dépendre des services distants.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Une base locale vide reçoit toutes les migrations dans l’ordre sans
      erreur d’intégrité ni violation de clé étrangère.
- [ ] Une base représentant la version immédiatement précédente peut recevoir
      les mêmes migrations sans perdre ses données.
- [ ] Un jeu de test peut appeler une route HTTP avec une vraie D1 locale et
      contrôler la réponse ainsi que les effets persistés.
- [ ] Firebase, Resend, Turnstile et la source de taux de change possèdent des
      interfaces remplaçables par des doubles déterministes dans les tests.
- [ ] Une liste d’emails peut créer de manière idempotente des comptes
      éligibles aux adresses normalisées.
- [ ] Deux imports identiques de la whitelist ne créent aucun doublon et
      produisent un rapport cohérent.
- [ ] Les fondations de compte, session et jeton déjà présentes sont conservées
      ou approfondies derrière une interface unique.
- [ ] Les validations lint, types, tests, formatage et build Cloudflare passent.
