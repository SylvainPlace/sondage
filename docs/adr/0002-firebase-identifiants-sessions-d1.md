# ADR 0002 — Firebase pour les identifiants, sessions applicatives dans D1

- Statut : accepté
- Date : 2026-07-30

## Contexte

Après une première vérification par code email, les alumni doivent utiliser un
mot de passe classique. Un hash de mot de passe suffisamment robuste est
volontairement coûteux ; l’exécuter dans un Worker Free avec un budget CPU
faible augmenterait le risque d’indisponibilité lors de connexions simultanées.
Le produit doit néanmoins conserver des sessions longues, révocables et
administrables.

## Décision

Firebase Authentication vérifie uniquement les identifiants email/mot de
passe. Resend envoie le code à six chiffres de première activation. D1 conserve
le compte métier et le `firebase_uid`, mais aucun hash de mot de passe.

Après validation d’un jeton Firebase côté serveur, l’application crée une
session opaque propre au produit. Seule l’empreinte du jeton de session est
stockée dans D1 ; le navigateur reçoit un cookie
`__Host-alumni_session`, `HttpOnly`, `Secure`, `SameSite=Lax`, limité au chemin
racine. La session glisse à chaque activité et expire après quinze mois
d’inactivité.

Les données de carrière, consentements, emails, statistiques et opérations
d’administration restent exclusivement dans D1.

## Conséquences

- Le budget CPU du Worker n’est pas utilisé pour dériver des mots de passe.
- Une dépendance externe supplémentaire existe pour l’authentification.
- Toute requête authentifiée s’appuie sur le compte D1 et son état, jamais
  directement sur l’email fourni par le client.
- La suspension, la déconnexion globale et la suppression révoquent les
  sessions D1 ; la suppression désactive aussi l’utilisateur Firebase.
- Les actions sensibles exigent un jeton Firebase récemment réauthentifié.
- Les secrets Firebase serveur et Resend ne sont jamais exposés au navigateur.

## Alternatives écartées

- Hash des mots de passe dans D1 : techniquement possible, mais peu adapté au
  budget CPU gratuit et plus risqué à opérer.
- Lien magique à chaque connexion : consomme le quota email et crée un point de
  contention pendant les campagnes.
- Sessions Firebase seules : ne couvrent pas aussi simplement l’inactivité de
  quinze mois, la liste des appareils et la révocation métier centralisée.
