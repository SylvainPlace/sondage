# Guide de Contribution

Ce document décrit les conventions à suivre pour contribuer au projet.

# Guide de Contribution

Ce document décrit les conventions à suivre pour contribuer au projet.

## 📝 Conventions de Commit

Nous suivons la spécification **Conventional Commits**. Tous les messages de commit doivent être rédigés en **Anglais**.

### Format

```
<type>(<scope optionnel>): <description>
```

### Types Autorisés

- **feat** : Nouvelle fonctionnalité
- **fix** : Correction de bug
- **docs** : Modifications de la documentation
- **style** : Changements de formatage (espaces, formatage, points-virgules manquants, etc.)
- **refactor** : Modification du code qui ne corrige pas de bug ni n'ajoute de fonctionnalité
- **perf** : Amélioration des performances
- **test** : Ajout ou correction de tests
- **chore** : Tâches de maintenance (build, dépendances, outils)

### Exemples

- `feat: separate PO and Project Manager roles in normalization`
- `fix(auth): fix JWT token validation logic`
- `docs: update installation guide in README`
- `chore: update npm dependencies`

## 💻 Standards de Code & Bonnes Pratiques

### Général
- **Langue** : L'anglais est préféré pour les commentaires de code et les noms de variables (bien que le code existant puisse être mixte, le nouveau code doit viser l'anglais).
- **Nommage** : Utilisez des noms de variables et de fonctions descriptifs.
  - `camelCase` pour les variables et les fonctions.
  - `PascalCase` pour les composants React et les Interfaces/Types.
  - `UPPER_CASE` pour les constantes.

### TypeScript
- **Typage Strict** : Évitez `any` autant que possible. Définissez des interfaces ou des types pour les props et les structures de données.
- **Interfaces vs Types** : Utilisez `interface` pour les définitions d'objets susceptibles d'être étendues, et `type` pour les unions/intersections.

### React / Next.js
- **Server Components** : Par défaut, utilisez les Server Components. Ajoutez `"use client"` uniquement lorsque nécessaire (état, effets, écouteurs d'événements).
- **Hooks** : Suivez les règles des Hooks (appels uniquement au niveau supérieur).
- **Structure des Fichiers** : Gardez les composants et la logique liés proches (colocation).

### CSS / Style
- **CSS Global** : Actuellement utilise `globals.css`. Assurez-vous que les nouveaux styles n'entrent pas en conflit avec les noms de classes globaux existants.
- **Responsivité** : Assurez-vous que l'interface fonctionne sur mobile.

## 🚀 Workflow

1. Créez une branche pour votre fonctionnalité ou correction (`feat/ma-feature` ou `fix/mon-bug`).
2. Faites vos modifications en suivant les standards de code.
3. Commitez en utilisant la convention en anglais ci-dessus.
4. Ouvrez une Pull Request.
