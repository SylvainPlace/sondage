# 03 — Activer et connecter un alumni

**What to build:** permettre à une adresse autorisée d’activer son compte par
code email, de choisir un mot de passe Firebase puis de se connecter à l’espace
privé avec une session applicative sécurisée.

**Blocked by:** 01 — Stabiliser le socle D1 et la frontière de test API ; 02 —
Prototyper et valider l’expérience V1.

**Status:** ready-for-agent

- [ ] La page publique présente le service sans afficher de statistique et
      propose l’activation ou la connexion.
- [ ] Une demande d’activation exige une validation Turnstile côté serveur et
      retourne la même réponse pour une adresse connue ou inconnue.
- [ ] Une adresse éligible reçoit un code à six chiffres valable dix minutes,
      utilisable une seule fois et soumis à un nombre maximal de tentatives.
- [ ] La validation du code permet de choisir un mot de passe et associe
      l’identité Firebase au compte D1 sans stocker de hash de mot de passe.
- [ ] Une connexion Firebase réussie pour un compte D1 actif crée une session
      opaque et un cookie `__Host-`, `HttpOnly`, `Secure` et `SameSite=Lax`.
- [ ] Une identité Firebase sans compte D1 actif n’obtient jamais de session.
- [ ] Les erreurs partielles entre Firebase, D1 et Resend sont récupérables sans
      laisser un compte activé de manière incohérente.
- [ ] Les scénarios HTTP couvrent adresse inconnue, code expiré, code consommé,
      tentatives dépassées, identifiants invalides et succès.
