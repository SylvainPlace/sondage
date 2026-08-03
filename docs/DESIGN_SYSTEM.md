# Design system NIL — Sanctuaire du Nil

Cette fiche transforme la variante E validée en règles utilisables par les
écrans de production. L’ADR 0003 porte la décision ; ce document porte son
application.

## Principes

1. **Institutionnel, pas administratif.** L’interface inspire confiance sans
   ressembler à un logiciel de gestion générique.
2. **Le parcours avant la donnée.** Un titre éditorial explique la page avant
   les indicateurs et les graphiques.
3. **Le courant du Nil indique le mouvement.** Le gradient bleu-turquoise est
   réservé aux actions principales, à la progression et à quelques accents.
4. **La confidentialité reste visible.** Tout agrégat masqué explique le seuil
   de huit alumni distincts sans révéler d’information sur le segment.

## Couleurs

| Rôle | Token | Valeur | Usage |
| --- | --- | --- | --- |
| Encre principale | `--nil-navy-950` | `#0B1A5A` | Titres, texte fort |
| Encre secondaire | `--nil-navy-800` | `#112A6F` | Valeurs, navigation |
| Repère | `--nil-blue-700` | `#163F87` | Intertitres, libellés |
| Progression | `--nil-royal-600` | `#3749C0` | Séries et début de gradient |
| Action | `--nil-blue-500` | `#3084E4` | Contrôles et liens actifs |
| Accent clair | `--nil-cyan-400` | `#32CCE0` | Focus, fin de progression |
| Accent vivant | `--nil-turquoise-400` | `#35C6C6` | Confirmation et comparaison |
| Fond | `--nil-surface-page` | `#F5FBFF` | Arrière-plan général |
| Surface | `--nil-surface-raised` | `#FFFFFF` | Cartes et panneaux |

Le cyan et le turquoise ne portent jamais seuls du texte courant sur fond
blanc. Le rouge est réservé aux erreurs et actions destructrices ; le vert aux
confirmations explicites.

## Typographie

- **Interface et données :** Inter, déjà chargé localement par Next.js, avec les
  polices système comme repli.
- **Titres éditoriaux :** Georgia puis Times New Roman. Cette famille est
  utilisée pour le titre de page, les grands nombres et les introductions, pas
  pour les champs de formulaire.
- **Libellés de section :** Inter, 11 à 12 px, graisse 700, capitales et
  espacement de lettres compris entre `0.12em` et `0.22em`.
- **Corps :** 16 px, hauteur de ligne minimale de 1,5. Les métadonnées ne
  descendent pas sous 12 px en production.

Échelle recommandée : 12, 14, 16, 20, 28, 40 et 64 px. Les titres utilisent
`clamp()` afin de réduire progressivement sur mobile.

## Espacement et surfaces

Le rythme est fondé sur 4 px. Les tokens exposent 4, 8, 12, 16, 24, 32, 48 et
64 px. Une carte utilise généralement 24 à 32 px de marge interne sur ordinateur
et 20 à 24 px sur mobile.

- rayon standard : 12 px ;
- rayon ample : 20 px pour les blocs éditoriaux ;
- ombre discrète : `--nil-shadow-sm` ;
- ombre de mise en avant : `--nil-shadow-md` ;
- bordure standard : `--nil-border`.

Les cartes ne flottent pas au survol : elles représentent de l’information, pas
nécessairement une action. Seuls les boutons et éléments réellement interactifs
peuvent se déplacer d’un pixel.

## Navigation

Sur ordinateur, l’espace privé utilise une barre latérale de 248 px et un
en-tête de 64 px. La section courante combine texte, fond pâle et bordure : la
couleur n’est jamais le seul indicateur.

Sous 940 px, la barre latérale devient un tiroir déclenché depuis l’en-tête. Le
logo compact reste visible. Sous 700 px, les navigations secondaires deviennent
défilables horizontalement si elles ne peuvent pas tenir sur une ligne.

## Composants

### Boutons

- primaire : gradient NIL, une seule action dominante par région de page ;
- secondaire : fond clair et contour bleu ;
- texte : action tertiaire sans boîte ;
- danger : rouge, jamais utilisé pour une navigation ordinaire.

Tous les boutons ont une zone cible minimale de 44 px sur mobile, un libellé
verbal et un focus visible.

### Cartes et panneaux

Une carte contient un seul sujet. Un cluster analytique peut juxtaposer des
cartes, mais la page ne doit pas devenir une grille uniforme : la fiche de
situation, le graphique principal et l’interprétation ont des poids différents.

### Graphiques

- bleu nuit : série principale ou valeur de référence ;
- bleu clair : série de comparaison ;
- turquoise : progression ou état favorable ;
- motifs, libellés ou formes complètent la couleur ;
- chaque graphique est suivi d’une interprétation courte en langage courant ;
- en dessous de huit alumni distincts, le graphique entier est remplacé par un
  panneau de confidentialité, sans axe ni valeur partielle.

## Écrans

- **Page publique :** présentation du service et connexion, aucune statistique.
- **Cockpit :** situation, fraîcheur, évolution personnelle et quelques repères.
- **Profil :** formulaire et historique, avec sauvegarde explicite.
- **Explorateur :** synthèse, onglets thématiques, filtres persistants et choix
  entre situations actuelles et historique.
- **Administration :** plus dense, mais conserve les tokens, la navigation et
  les états des composants partagés.

## Assets et code

- logo : `public/logo-nil.jpg` ;
- tokens : `src/styles/nil-tokens.css` ;
- logo réutilisable : `src/components/ui/NilLogo.tsx` ;
- primitives existantes migrées : `Button` et `Card` dans `src/components/ui/`.
