# Archive — ancien sondage alumni

Cette arborescence contient l’application remplacée : dashboard, filtres,
graphiques, carte, boîte à idées, connexion par mot de passe partagé, API Google
Sheets/JWT et assets associés.

Elle est conservée uniquement comme référence pour la reprise de logique. Elle
n’est plus compilée, testée ni déployée. Les imports `@/` qu’elle contient
pointaient vers l’ancien dossier `src` et ne constituent plus une application
autonome exécutable.

La normalisation historique reste volontairement active dans
`src/lib/normalization.ts`, car elle sera utilisée par l’import des anciennes
réponses. Les migrations D1, les comptes, les sessions, les prototypes et le
design system NIL ne font pas partie de cette archive.
