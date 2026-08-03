# ADR 0003 — « Sanctuaire du Nil » comme identité visuelle

- Statut : accepté
- Date : 2026-08-03

## Contexte

Le prototype du cockpit a comparé cinq directions. La variante E conserve la
structure analytique de « Sanctuaire solaire » tout en reprenant le mouvement et
les couleurs du nouveau logo NIL. Elle a été retenue comme direction commune
pour l’espace public, le cockpit, le profil, l’explorateur et l’administration.

## Décision

L’interface utilise « Sanctuaire du Nil » comme fondation visuelle :

- bleu nuit pour le texte et les repères institutionnels ;
- bleu royal, bleu clair, cyan et turquoise pour les actions, progressions et
  séries de données ;
- surfaces blanches sur un fond bleu très pâle ;
- titres éditoriaux amples et interface compacte, sans transformer les éléments
  décoratifs égyptiens en pictogrammes fonctionnels ;
- navigation latérale sur ordinateur et en-tête compact avec tiroir sur mobile ;
- cartes peu élevées, angles de 12 px et rythme d’espacement fondé sur 4 px ;
- gradients réservés aux actions principales, progressions et accents de marque.

Les valeurs sources vivent dans `src/styles/nil-tokens.css`. Les composants de
production consomment des variables sémantiques et non des couleurs en dur. Le
logo de référence est servi localement depuis `public/logo-nil.jpg`.

## Accessibilité et responsive

Le bleu nuit porte le texte sur les surfaces claires. Le cyan n’est jamais
utilisé seul pour un texte courant. Les états ne reposent pas uniquement sur la
couleur. Le focus clavier reste visible et la réduction des animations système
doit être respectée.

Sous 940 px, la navigation latérale disparaît au profit de l’en-tête. Sous
700 px, les clusters analytiques passent sur une colonne, les actions peuvent
occuper toute la largeur et les filtres de l’explorateur vivent dans un tiroir.

## Conséquences

- Les anciens alias CSS restent disponibles pendant la migration des écrans.
- Les interfaces de production sont réécrites à partir des tokens et composants
  partagés ; le code du prototype n’est pas promu directement.
- Les autres variantes restent une source de conception, mais ne définissent
  plus le produit.
