# Issue tracker: Local Markdown

Les specs et tickets de ce dépôt vivent dans `.scratch/`.

## Conventions

- Un dossier par fonctionnalité : `.scratch/<feature>/`
- La spec : `.scratch/<feature>/spec.md`
- Un fichier par ticket :
  `.scratch/<feature>/issues/<NN>-<slug>.md`
- Les tickets sont numérotés dans l’ordre de leurs dépendances.
- Leur état est indiqué par une ligne `Status:`.
- Les dépendances sont indiquées par une ligne `Blocked by:`.

Lorsqu’un skill demande de publier une spec ou un ticket, il crée le fichier
correspondant dans `.scratch/`.

Lorsqu’un skill demande de récupérer un ticket, il lit le chemin transmis par
l’utilisateur.
