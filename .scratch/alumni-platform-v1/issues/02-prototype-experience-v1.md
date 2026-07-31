# 02 — Prototyper et valider l’expérience V1

**What to build:** permettre à l’association de comparer plusieurs directions
UX/UI exécutables sur les écrans clés, puis de choisir ou combiner une direction
avant que les interfaces de production soient construites.

**Blocked by:** None — can start immediately.

**Status:** in-review

- [x] Au moins trois directions visuelles réellement différentes sont
      accessibles dans un prototype isolé du produit de production.
- [x] Chaque direction couvre la page publique et la connexion, le cockpit, la
      contribution d’une activité et d’un relevé, l’explorateur et un aperçu de
      l’administration.
- [x] Les écrans utilisent un contenu réaliste et présentent les états vide,
      incomplet, chargement, erreur, historique et segment confidentiel masqué.
- [x] Chaque direction est vérifiable sur une largeur mobile et une largeur
      ordinateur avec une navigation clavier compréhensible.
- [x] Des captures comparables permettent d’évaluer hiérarchie, densité,
      lisibilité des graphiques, formulaires et filtres.
- [ ] La direction retenue peut être une proposition complète ou une hybridation
      explicitement décrite.
- [ ] La décision finale documente palette, typographie, espacements,
      navigation, composants partagés, graphiques et comportements responsive.
- [x] Le prototype reste jetable, ne dépend pas de services de production et
      peut être retiré sans affecter l’application finale.

## Revue du prototype

Le prototype est accessible uniquement en développement sur `/prototype/alumni`.
Les paramètres `variant`, `view` et `state` rendent chaque combinaison
partageable ; le sélecteur flottant permet aussi de naviguer entre les variantes
avec les flèches du clavier.

Les captures de comparaison et les consignes de revue sont disponibles dans
`docs/prototypes/alumni-v1/`. La clôture du ticket attend le choix d’une
direction ou la description explicite d’une hybridation.

Après une préférence exprimée pour le cockpit clair, une seconde passe propose
quatre raffinements moins génériques sur `/prototype/alumni/cockpit-clair`. La
variante C traduit l’iconographie égyptienne du logo en cartouche et registres
d’information. La variante D adapte la référence « Sanctuaire d’Isis — Version
solaire » en navigation institutionnelle et cluster analytique. Les choix sont
détaillés dans `docs/prototypes/alumni-v1/cockpit-clair/README.md`.
