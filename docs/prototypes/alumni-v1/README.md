# Prototype de l’expérience alumni V1

Ce prototype jetable sert à choisir une direction UX/UI avant l’implémentation
des interfaces de production. Il ne dépend d’aucun service métier et sa route
renvoie une page introuvable en production.

## Lancer et comparer

```powershell
npm run dev
```

Ouvrir ensuite :

```text
http://localhost:3000/prototype/alumni
```

Le sélecteur flottant contrôle :

- la direction A, B ou C ;
- l’écran simulé : accueil, cockpit, contribution, explorateur ou admin ;
- l’état des données : complet, vide, chargement, erreur, historique ou
  confidentiel.

Les flèches gauche et droite du clavier changent de direction. L’URL conserve
les choix, par exemple :

```text
/prototype/alumni?variant=B&view=explorer&state=historical
```

## Directions proposées

### A — Cockpit clair

Une interface familière, lumineuse et progressive. La situation personnelle est
immédiatement lisible, la contribution ressemble à un parcours guidé et
l’explorateur garde des filtres visibles sans devenir trop dense.

### B — Rapport narratif

Une expérience éditoriale qui raconte les trajectoires. Les chiffres sont
accompagnés d’interprétations fortes, la contribution adopte le ton d’un
entretien et l’administration met les décisions en scène.

### C — Studio de données

Une interface compacte destinée aux utilisateurs qui veulent inspecter, comparer
et agir rapidement. Les surfaces privilégient matrices, panneaux, statuts et
commandes au détriment d’une prise en main plus douce.

## Matrice de captures

Chaque direction possède une capture desktop pour les cinq surfaces :

| Surface              | A                            | B                            | C                            |
| -------------------- | ---------------------------- | ---------------------------- | ---------------------------- |
| Accueil et connexion | `a-public-login-desktop.png` | `b-public-login-desktop.png` | `c-public-login-desktop.png` |
| Cockpit              | `a-cockpit-desktop.png`      | `b-cockpit-desktop.png`      | `c-cockpit-desktop.png`      |
| Contribution         | `a-contribution-desktop.png` | `b-contribution-desktop.png` | `c-contribution-desktop.png` |
| Explorateur          | `a-explorer-desktop.png`     | `b-explorer-desktop.png`     | `c-explorer-desktop.png`     |
| Administration       | `a-admin-desktop.png`        | `b-admin-desktop.png`        | `c-admin-desktop.png`        |

Les captures `a-cockpit-mobile.png`, `b-cockpit-mobile.png` et
`c-cockpit-mobile.png` permettent de comparer le comportement responsive.

## Raffinement du cockpit clair

À la suite de la première revue, quatre variantes moins génériques du cockpit
clair sont disponibles sur :

```text
/prototype/alumni/cockpit-clair?variant=A
```

La variante C explore une identité inspirée des hiéroglyphes et du panthéon
égyptien, déjà suggérée par le logo de l’association. La variante D adapte le
format « Sanctuaire d’Isis — Version solaire » fourni pendant la revue. Le plan
de design et les captures sont documentés dans `cockpit-clair/README.md`.

## Points à décider

- Quelle structure donne le plus envie de revenir actualiser sa situation ?
- Quelle densité convient à la majorité des alumni ?
- Quelle part d’interprétation narrative doit accompagner les graphiques ?
- Faut-il retenir une direction entière ou, par exemple, la structure de A,
  l’interprétation de B et certains outils avancés de C ?
