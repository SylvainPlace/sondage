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

## Captures

Chaque variante dispose d’une capture desktop et mobile :

- `a-carnet-desktop.png` et `a-carnet-mobile.png` ;
- `b-registre-desktop.png` et `b-registre-mobile.png` ;
- `c-pantheon-desktop.png` et `c-pantheon-mobile.png`.
- `d-sanctuaire-desktop.png` et `d-sanctuaire-mobile.png`.
