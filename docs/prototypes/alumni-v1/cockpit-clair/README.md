# Raffinement du cockpit clair

## Question de design

Comment conserver la lisibilité du premier cockpit clair sans retrouver les
codes d’un dashboard générique ? Le sujet est la situation professionnelle d’un
alumni ; la page doit lui permettre de comprendre ce qui a changé et
d’actualiser son relevé.

```text
/prototype/alumni/cockpit-clair?variant=A
/prototype/alumni/cockpit-clair?variant=B
/prototype/alumni/cockpit-clair?variant=C
/prototype/alumni/cockpit-clair?variant=D
/prototype/alumni/cockpit-clair?variant=E
```

Les flèches du sélecteur ou du clavier changent de variante.

## A — Carnet de promotion

- Palette : papier froid `#F1F4F1`, encre `#183447`, vert confirmation
  `#2F6B58`, safran `#D09A31`, blanc `#FFFFFF`.
- Typographie : Arial Narrow pour la hiérarchie, Trebuchet pour l’interface,
  Georgia uniquement pour la lecture comparative.
- Structure : une fiche d’activité et un repère de promotion assemblés comme les
  deux pages ouvertes d’un carnet.
- Signature : la barre de fraîcheur du profil traverse la page et rattache
  chaque donnée à sa date de confirmation.

## B — Registre de carrière

- Palette : blanc `#FFFFFF`, gris administratif `#E8ECEF`, cobalt `#214D84`,
  jaune d’index `#D8A13B`, vert statut `#1F5948`.
- Typographie : Arial Narrow pour les données principales, Verdana pour la
  lecture, Consolas pour les métadonnées.
- Structure : un dossier nominatif fixe, un tableau de valeurs et un registre
  chronologique.
- Signature : la trajectoire est traitée comme un registre consultable, avec des
  lignes et des statuts plutôt que des cartes.

## C — Panthéon

- Palette : lapis `#14264D`, pierre `#D8D1BD`, papyrus `#ECE4CF`, or `#C5963D`,
  malachite `#2F6F60`, ocre rouge `#A94A36`.
- Typographie : Palatino pour la stèle, Trebuchet pour les actions, Lucida
  Console pour les légendes et Segoe UI Historic pour les hiéroglyphes.
- Structure : un cartouche identifie l’alumni ; trois registres portent
  l’activité, les ressources et le panorama comparatif.
- Signature : le langage visuel du logo devient une véritable grammaire
  d’information. Les hiéroglyphes repèrent les registres mais ne remplacent
  jamais les libellés accessibles.

Cette piste assume le papyrus et la typographie classique, des choix qui
pourraient sembler génériques hors contexte. Le cartouche, le lapis et
l’organisation en registres les rattachent ici directement à l’identité
égyptienne demandée.

## D — Sanctuaire solaire

- Palette : ivoire `#FFFDFA`, or sombre `#745B00`, or solaire `#F2CA50`, pierre
  claire `#FAF9F6`, contour `#D0C5AF`, encre `#201F21`.
- Typographie : Georgia pour la thèse et les titres, Trebuchet pour l’interface
  et les données.
- Structure : une navigation institutionnelle latérale, une barre d’archives, un
  sceau de profil et un cluster analytique en bento.
- Signature : le titre « Le sanctuaire de Sophie — Version solaire » ouvre la
  page comme une thèse, puis les données de carrière prennent la place des
  filtres abstraits de la référence.

Cette variante adapte la maquette « Le Sanctuaire d’Isis (Version Solaire) »
fournie pour la revue. Elle ne dépend ni de Tailwind, ni de Google Fonts, ni
d’images distantes.

## E — Sanctuaire du Nil

- Palette extraite du nouveau logo : bleu nuit `#0B1A5A`, bleu profond
  `#112A6F`, bleu royal `#3749C0`, bleu clair `#3084E4`, cyan `#32CCE0` et
  turquoise `#35C6C6`.
- Structure : strictement identique à la variante D pour isoler l’effet de la
  nouvelle identité visuelle.
- Signature : le titre, les indicateurs, les graphiques et les actions suivent
  le courant coloré du logo, du bleu nuit vers le turquoise.
- Logo : la référence fournie est intégrée dans `public/logo-nil.jpg` et
  utilisée dans la navigation desktop et l’en-tête mobile.

Le cyan et le turquoise restent réservés aux progressions et aux actions. Les
textes utilisent le bleu nuit afin de conserver un contraste suffisant sur les
surfaces très claires.

## Verdict

La variante E est retenue comme direction officielle. Elle conserve de D la
navigation institutionnelle, le sceau de profil et le cluster analytique, tout
en adoptant le logo et le courant bleu-turquoise de NIL. Les décisions pérennes
sont consignées dans `docs/adr/0003-identite-visuelle-sanctuaire-du-nil.md` et
les tokens de production dans `src/styles/nil-tokens.css`.

## Captures

Chaque variante dispose d’une capture desktop et mobile :

- `a-carnet-desktop.png` et `a-carnet-mobile.png` ;
- `b-registre-desktop.png` et `b-registre-mobile.png` ;
- `c-pantheon-desktop.png` et `c-pantheon-mobile.png`.
- `d-sanctuaire-desktop.png` et `d-sanctuaire-mobile.png`.
- `e-sanctuaire-nil-desktop.png` et `e-sanctuaire-nil-mobile.png`.
