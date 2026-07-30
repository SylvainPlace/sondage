# Rework de la plateforme alumni — cadrage produit

> Document vivant consolidant les décisions prises pendant le cadrage.

## 1. Vision

Créer un espace privé dans lequel chaque alumni peut maintenir son parcours
professionnel à jour. Ces contributions doivent produire des statistiques plus
fraîches et plus précises pour la communauté.

À terme, la plateforme proposera également :

- un annuaire permettant de savoir où travaillent les alumni qui acceptent
  d’être visibles ;
- un évaluateur permettant de situer une offre d’emploi par rapport à des
  situations comparables.

## 2. Principes directeurs

- Le coût récurrent d’exploitation doit rester nul.
- Les données individuelles restent sous le contrôle de leur propriétaire.
- Les rémunérations individuelles ne sont jamais visibles par les autres
  alumni ni par les administrateurs.
- Une statistique n’est affichée qu’à partir de trois alumni distincts.
- La saisie initiale reste courte ; les enrichissements sont facultatifs et
  progressifs.
- L’interface est conçue d’abord pour mobile, sans limiter l’exploration sur
  ordinateur.

## 3. Périmètre et versions

### V1 — Fondations

- Authentification individuelle : code email à la première activation, puis
  mot de passe personnel.
- Profil alumni.
- Activités professionnelles et historique des relevés de situation.
- Stockage des nouvelles données dans Cloudflare D1.
- Cockpit personnel.
- Explorateur de statistiques.
- Administration des accès.
- Déplacement de la boîte à idées vers une page dédiée.

### V2 — Annuaire

- Recherche d’alumni.
- Affichage des seules informations explicitement autorisées.
- Prise de contact selon les préférences de chaque alumni.

### V3 — Évaluateur d’offres

- Saisie structurée d’une offre.
- Comparaison avec les relevés professionnels pertinents.
- Restitution nuancée tenant compte de la qualité de l’échantillon.

### V4 éventuelle — Import d’offres

- Extraction d’informations depuis une annonce, un document ou un PDF.
- Cette version reste conditionnée à une solution fiable et sans coût
  récurrent.

## 4. État actuel et reprise des données

### État actuel

- L’accès repose sur une whitelist d’adresses email et un mot de passe global
  partagé.
- Les réponses du sondage sont lues depuis Google Sheets.
- Les réponses historiques ne sont pas associées aux adresses email.
- La comparaison personnelle est enregistrée uniquement dans le
  `localStorage`.
- Cloudflare D1 stocke déjà les idées et les votes.

### Reprise retenue

- Les réponses historiques restent anonymes, datées et séparées des nouveaux
  profils.
- Aucun alumni ne peut réclamer ou rattacher une ancienne réponse à son compte.
- Les nouveaux comptes commencent avec un profil neuf.
- Les réponses historiques sont importées une seule fois dans D1 avec leur date
  de sondage et un identifiant de source.
- L’import produit un rapport de contrôle indiquant les lignes importées,
  ignorées ou invalides.
- Après validation, D1 devient l’unique source interrogée par l’application.
- Le Google Sheet original reste une archive externe inchangée et n’est plus
  requis par le fonctionnement en production.
- Les réponses historiques restent visibles pendant la montée en charge afin
  que l’explorateur ne soit pas vide au lancement.
- Les indicateurs historiques et actuels sont toujours identifiés séparément ;
  ils ne sont pas fusionnés silencieusement dans une même moyenne.
- La priorité donnée aux nouveaux relevés augmente progressivement avec la
  taille de l’échantillon frais disponible.

### Transition vers les nouvelles données

La transition est évaluée pour chaque segment filtré :

- de zéro à deux profils récents, seule la référence historique est affichée ;
- de trois à sept profils récents, données actuelles et historiques sont
  affichées côte à côte avec une mention signalant l’échantillon limité ;
- à partir de huit profils récents, les données actuelles deviennent la
  référence principale et l’historique reste disponible comme comparaison.

Le seuil de confidentialité de trois alumni continue de s’appliquer aux données
actuelles.

### Compatibilité des rémunérations

- Les nouveaux relevés enregistrent un montant annuel exact.
- Ce montant n’est jamais affiché individuellement.
- Les anciennes tranches sont conservées avec leur libellé et leur source
  d’origine.
- Pour les calculs qui l’exigent, une tranche historique est convertie en une
  valeur représentative documentée, par exemple 45–50 k€ en 47,5 k€.
- Les graphiques signalent lorsqu’un résultat contient des estimations issues
  des données historiques.
- Dès que huit profils récents sont disponibles pour le segment, les montants
  exacts récents deviennent la référence principale.

### Devises et temps de travail

- Le montant, la devise et le temps de travail saisis sont conservés comme
  valeurs originales.
- Une valeur dérivée calcule l’équivalent annuel en euros.
- Une seconde valeur dérivée calcule l’équivalent annuel à temps plein.
- Le taux de change correspond à la date d’observation et sa source est
  conservée.
- L’explorateur permet de comparer les montants réellement perçus ou les
  équivalents temps plein.
- Toute conversion est explicitement signalée et n’écrase jamais la déclaration
  d’origine.

### Fraîcheur d’un relevé

- Jusqu’à douze mois, le dernier relevé est considéré comme récent.
- Entre douze et trente-six mois, elle reste incluse dans les statistiques
  actuelles mais porte la mention « à confirmer ».
- Au-delà de trente-six mois, elle est exclue des statistiques actuelles et
  reste disponible uniquement dans l’historique.
- Le cockpit permet de confirmer en un clic que la situation actuelle n’a pas changé,
  sans ressaisir le formulaire.

### Rappels d’actualisation

- L’administration affiche la liste et le volume des rappels pouvant être
  envoyés.
- Les échéances de rappel sont configurables.
- Les envois sont placés dans une file et répartis dans le temps.
- Une fois la configuration activée, les rappels sont envoyés automatiquement
  sans validation manuelle des lots.
- Une limite quotidienne configurable s’applique uniquement aux rappels.
- Une partie du quota quotidien du fournisseur reste ainsi disponible pour les
  codes d’activation, les récupérations de mot de passe et les changements
  d’adresse.
- L’administration permet de prévisualiser les rappels à venir, de mettre la
  file en pause et de consulter le journal des envois.
- Les alumni peuvent désactiver les rappels d’actualisation depuis leur profil.

## 5. Architecture technique

- Next.js 16, React et TypeScript.
- Cloudflare Workers pour l’hébergement.
- `@opennextjs/cloudflare` pour adapter, prévisualiser et déployer
  l’application Next.js sur Cloudflare Workers.
- Cloudflare D1 pour les comptes, profils, activités, relevés, autorisations,
  idées et votes.
- Firebase Authentication uniquement pour vérifier les identifiants
  email/mot de passe.
- Resend pour les codes d’activation et les autres emails applicatifs.

Cette architecture reste compatible avec les offres gratuites à petite
échelle, selon les tarifs consultés le 30 juillet 2026 :

- Resend : 3 000 emails transactionnels par mois, avec une limite de 100 par
  jour ;
- Cloudflare D1 : 5 millions de lignes lues par jour, 100 000 lignes écrites
  par jour et 5 Go de stockage sur Workers Free.

## 6. Comptes et administration

### Accès alumni

- Seules les adresses présentes dans la liste de l’association peuvent se
  connecter.
- Lors de la première connexion, l’alumni reçoit par email un code à six
  chiffres, valable dix minutes et utilisable une seule fois.
- Après vérification de son adresse, il crée un mot de passe personnel.
- Les connexions suivantes utilisent l’adresse email et le mot de passe, sans
  nouvel envoi d’email.
- La récupération d’un mot de passe et le changement d’adresse exigent une
  nouvelle vérification par code.
- Les codes et tentatives de connexion sont limités afin de prévenir les abus.
- Firebase Authentication vérifie l’email et le mot de passe ; aucun hash de
  mot de passe n’est conservé dans D1.
- D1 conserve l’identifiant Firebase du compte, ses droits et ses sessions,
  tandis que toutes les données alumni restent dans D1.

### Lancement et invitations

- Le lancement initial est annoncé manuellement sur le groupe de discussion de
  l’association.
- Toute adresse autorisée peut ensuite activer spontanément son compte depuis
  la page publique.
- Aucune campagne email massive n’est envoyée automatiquement au lancement.
- L’administration peut programmer ultérieurement des invitations par lots aux
  comptes non activés.
- Les invitations disposent d’une limite quotidienne distincte afin de
  préserver le quota nécessaire aux codes et aux récupérations.
- Une seule relance facultative peut être programmée pour les comptes non
  activés.

### Sessions

- La session est renouvelée automatiquement à chaque utilisation.
- Pour un alumni actif, elle reste ouverte jusqu’à une déconnexion explicite.
- Une session expire après quinze mois d’inactivité complète.
- Les sessions D1 sont révoquées après une suspension du compte ou un
  changement de mot de passe.
- Les actions sensibles, notamment le changement d’adresse, la suppression du
  compte et l’accès administrateur, exigent une nouvelle saisie du mot de passe.
- L’alumni peut consulter et fermer ses autres sessions.
- Les jetons de session sont opaques, révocables et stockés dans des cookies
  `HttpOnly`, `Secure` et `SameSite`, jamais dans le `localStorage`.

### Rôle administrateur

Un administrateur peut :

- importer ou retirer des adresses autorisées ;
- renvoyer une invitation ;
- suspendre un compte ;
- traiter un changement d’adresse email.
- consulter les rappels d’actualisation éligibles avant envoi ;
- configurer les échéances de rappel ;
- définir une limite quotidienne dédiée aux rappels ;
- mettre en pause ou reprendre les envois de rappels.
- traiter les demandes de suppression de compte dans le délai réglementaire.
- programmer et superviser les campagnes d’invitations.

Un administrateur ne peut pas :

- modifier une activité ou un relevé appartenant à un alumni ;
- consulter un salaire ou un avantage individuel.

Les actions administratives sensibles sont journalisées.

### Suppression d’un compte

- L’alumni soumet une demande depuis son profil.
- La demande est transmise à l’administration et doit recevoir une réponse dans
  le délai réglementaire, au plus tard sous un mois hors prolongation
  légalement justifiée.
- Après traitement, le compte, les sessions, les consentements, la présence
  dans l’annuaire et les données directement identifiantes sont supprimés.
- Les idées et interactions communautaires sont attribuées à « Ancien membre ».
- Un relevé professionnel ne peut être conservé qu’après anonymisation
  irréversible : suppression de l’employeur et des textes libres, réduction de
  la précision géographique et temporelle, et regroupement de la rémunération
  par tranche.
- Tout relevé qui reste raisonnablement réidentifiable est supprimé.
- Les agrégats statistiques déjà anonymes peuvent être conservés.
- La politique définitive doit être validée juridiquement par l’association
  avant la mise en production.

## 7. Modèle de données

### Profil alumni

Le profil contient :

- l’année de diplôme ;
- la formation ou spécialité ;
- les diplômes complémentaires, facultatifs ;
- la disponibilité pour être contacté, recruter ou mentorer, facultative.

Le genre, l’âge et les coordonnées personnelles ne sont jamais obligatoires.

### Activité professionnelle et relevé de situation

Une activité professionnelle représente une période continue dans un métier et
une organisation. Un relevé de situation représente une photographie datée des
conditions de cette activité.

- Un changement de rémunération, de temps de travail ou d’avantages crée un
  nouveau relevé dans la même activité.
- Un changement d’employeur ou de métier clôture l’activité précédente et en
  crée une nouvelle.
- Une confirmation sans changement actualise la date de confirmation sans
  dupliquer l’activité.
- La situation actuelle est dérivée du dernier relevé confirmé de chaque
  activité encore ouverte.
- La date d’observation prend par défaut la date de saisie et reste modifiable.
- L’alumni peut modifier ou supprimer ses propres activités et relevés.

#### Champs obligatoires

- Date d’observation.
- Relation de travail.
- Domaine professionnel.
- Métier normalisé.
- Intitulé du poste.
- Secteur d’activité.
- Localisation.
- Type de contrat.
- Temps de travail.
- Salaire brut annuel fixe.
- Rémunération variable annuelle.

Les champs professionnels ou salariaux ne sont demandés que lorsqu’ils sont
pertinents pour le statut sélectionné.

### Activités simultanées et statut

- Un alumni peut avoir plusieurs activités professionnelles en même temps.
- Une activité peut être marquée comme principale.
- Le statut global est déduit des activités actives et peut être complété par
  recherche d’emploi, études ou interruption professionnelle.
- Les relations de travail initiales sont : CDI, CDD, titulaire de la fonction
  publique, contractuel du public, indépendant, alternance, stage, volontariat
  et autre.
- Le temps de travail et la rémunération appartiennent aux relevés de chaque
  activité.

#### Champs facultatifs

- Nom de l’employeur.
- Date de début et date de fin.
- Pays d’emploi et devise.
- Région de travail.
- Ville, facultative.
- Durée hebdomadaire du travail.
- Niveau de séniorité.
- Expérience professionnelle totale.
- Expérience dans le métier actuel.
- Responsabilité professionnelle et taille de l’équipe.
- Nature de l’organisation.
- Effectif de l’organisation employeuse.
- Stade de développement, lorsque pertinent.
- Intéressement et participation.
- Actions ou stock-options.
- Avantages.
- Nombre de jours de télétravail.
- Nombre de jours de congés et de RTT.

### Avantages professionnels

La taxonomie initiale contient :

- télétravail ;
- tickets restaurant ou carte restaurant ;
- voiture de fonction ;
- RTT ou congés supplémentaires ;
- intéressement ou participation ;
- autre.

Chaque avantage sélectionné peut recevoir une quantité ou une valeur adaptée à
sa nature. Par exemple :

- télétravail : jours par semaine ;
- tickets restaurant : valeur faciale et part employeur ;
- RTT ou congés : jours par an ;
- intéressement ou participation : montant annuel ;
- voiture de fonction : présence et précision facultative ;
- autre : libellé libre, valeur et unité facultatives.

Une saisie « autre » alimente une file de qualification visible dans
l’administration.

#### Qualification des valeurs « autre »

- Les nouvelles réponses enregistrent l’identifiant stable d’une catégorie
  sélectionnée ; elles ne dépendent pas d’une normalisation textuelle.
- Le libellé libre d’une valeur « autre » est conservé tel qu’il a été saisi.
- Une table d’alias administrable dans D1 propose des correspondances avec les
  catégories officielles.
- L’administrateur confirme le rattachement, crée une nouvelle catégorie ou
  conserve la valeur comme information libre non statistique.
- Une décision confirmée peut reclasser rétroactivement les autres valeurs
  strictement équivalentes après prévisualisation.
- Chaque reclassement est journalisé et peut être annulé.
- `src/lib/normalization.ts`, après renforcement de ses règles et de ses tests,
  sert uniquement au nettoyage contrôlé de l’import historique.

### Taxonomies administrables

Le même modèle de catégories, alias et qualification s’applique :

- aux domaines professionnels et aux métiers ;
- aux secteurs d’activité ;
- aux types d’entreprise ;
- aux avantages professionnels.

Une catégorie dite « officielle » est une catégorie canonique propre à
l’application. Elle possède un identifiant technique stable, un libellé
modifiable, des alias et un statut actif ou archivé. Elle ne désigne pas une
nomenclature administrative imposée.

### Organisation employeuse

Le « type de structure » historique est remplacé par trois dimensions :

- **Nature** : entreprise privée, organisme public, association ou fondation,
  coopérative ou mutuelle, indépendant.
- **Effectif** : 1, 2–9, 10–49, 50–249, 250–999, 1 000–4 999, 5 000 et plus.
- **Stade de développement**, uniquement lorsque pertinent : start-up,
  scale-up, organisation établie.

L’effectif concerne l’entité employeuse portée par le contrat, pas
automatiquement l’ensemble du groupe. Le secteur et le sous-secteur d’activité
restent des dimensions séparées.

### Secteurs d’activité initiaux

- **Santé** : Hôpital, Clinique, Médico-social, Laboratoire, Logiciels de santé,
  Industrie pharmaceutique, Dispositifs médicaux, Biotechnologies.
- **Numérique** : Édition logicielle, Services numériques,
  Télécommunications.
- **Conseil** : Conseil en technologie, Conseil en organisation, Conseil en
  stratégie.
- **Finance** : Banque, Assurance, FinTech.
- **Administration publique** : Administration centrale, Collectivité
  territoriale, Agence ou établissement public à activité administrative.
- **Éducation et recherche** : Enseignement supérieur, Recherche publique,
  Recherche privée.
- **Industrie**.
- **Commerce**.
- **Transport et logistique**.
- **Énergie et environnement**.
- **Autre**.

Le classement suit l’activité principale, indépendamment de la nature publique
ou privée. Un CHU est ainsi classé « organisme public » pour sa nature et
« Santé — Hôpital » pour son secteur. « Administration publique » est réservée
aux activités administratives, réglementaires, régaliennes ou de sécurité
sociale.

#### Domaines professionnels initiaux

- Produit.
- Gestion de projet.
- Ingénierie logicielle.
- Données et IA.
- Infrastructure et opérations.
- Cybersécurité.
- Conseil et intégration.
- Recherche.
- Commerce et relation client.
- Autre.

Le management n’est pas un domaine professionnel. Il est représenté par le
niveau de séniorité, la responsabilité managériale et la taille de l’équipe
associés au métier exercé.

#### Métiers initiaux

- **Produit** : Product Manager, Product Owner, Product Designer.
- **Gestion de projet** : Chef de projet, Responsable de programme, PMO,
  Scrum Master.
- **Ingénierie logicielle** : Développeur logiciel, Architecte logiciel,
  Ingénieur qualité.
- **Données et IA** : Data Analyst, Consultant BI, Data Engineer, Data
  Scientist, Machine Learning Engineer.
- **Infrastructure et opérations** : Administrateur systèmes, Ingénieur réseau,
  Ingénieur cloud, DevOps, SRE, Support technique.
- **Cybersécurité** : Analyste cybersécurité, Ingénieur cybersécurité, Auditeur
  sécurité.
- **Conseil et intégration** : Consultant fonctionnel, Consultant technique,
  Intégrateur.
- **Recherche** : Chercheur, Ingénieur de recherche, Doctorant.
- **Commerce et relation client** : Commercial, Business Developer, Account
  Manager, Customer Success Manager.
- **Autre** : métier libre en attente de qualification.

Tech Lead, Head of, Manager et Directeur sont des niveaux ou responsabilités,
pas des métiers distincts.

### Séniorité et responsabilités

- La séniorité est déclarée parmi Débutant, Confirmé, Senior et Expert.
- L’expérience professionnelle totale et l’expérience dans le métier actuel
  sont enregistrées séparément.
- Lead, Manager et Directeur sont des responsabilités associées au métier, pas
  des métiers ni des niveaux de séniorité.
- La taille de l’équipe encadrée est facultative.
- La séniorité n’est jamais déduite automatiquement du nombre d’années
  d’expérience.

### Correspondances proposées

- Lorsqu’une valeur « autre » ressemble à une catégorie existante,
  l’application peut proposer jusqu’à trois correspondances.
- L’utilisateur confirme une proposition ou maintient sa saisie dans « autre ».
- Une correspondance approximative n’est jamais appliquée silencieusement.
- Une valeur maintenue dans « autre » rejoint la file de qualification
  administrateur.
- Le texte original reste conservé même après un rattachement.
- Un alias confirmé améliore les futures propositions.

### Expérience de saisie

- Le formulaire principal se limite aux informations obligatoires applicables.
- Une section « Affiner ma situation » regroupe les champs facultatifs du
  relevé.
- Ces informations peuvent être ajoutées ultérieurement.

### Localisation et organisation du travail

- Le pays d’emploi correspond au pays du contrat ou de l’activité.
- La région de travail correspond au rattachement professionnel et est demandée
  lorsqu’elle est pertinente.
- La ville reste facultative et sert principalement à l’annuaire.
- L’organisation du travail est enregistrée séparément : sur site, hybride ou
  télétravail complet.
- Le nombre de jours de télétravail par semaine peut préciser une organisation
  hybride.
- Le télétravail n’est jamais utilisé comme une région.

## 8. Confidentialité et consentement

### Statistiques

- Les relevés alimentent les statistiques agrégées par défaut.
- Une statistique filtrée nécessite au moins trois alumni distincts.
- Le seuil compte les personnes, pas le nombre de relevés historiques.
- Sous ce seuil, la valeur est masquée et l’interface propose d’élargir les
  filtres.
- Plusieurs relevés appartenant au même alumni ne permettent jamais de
  contourner le seuil.

### Annuaire

- Le profil est absent de l’annuaire par défaut.
- La publication exige un consentement explicite.
- L’alumni choisit séparément la visibilité de son nom, son poste, son
  employeur, sa localisation et sa disponibilité au contact.
- Le salaire, la rémunération variable et les avantages ne sont jamais affichés
  individuellement.
- L’annuaire est réservé aux alumni authentifiés.
- Tous les choix sont modifiables et révocables à tout moment.

## 9. Architecture de l’information

### Accès public

La page publique :

- ne présente aucune donnée alumni ;
- explique la valeur du service ;
- invite les alumni à se connecter.

Toutes les fonctionnalités et données communautaires nécessitent une
authentification.

### Navigation authentifiée

- `/` : cockpit personnel.
- `/explorer` : exploration des données communautaires.
- `/profil` : identité, situation actuelle et historique.
- `/idees` : boîte à idées.
- `/annuaire` : annuaire, à partir de la V2.
- `/offres` : évaluateur d’offres, à partir de la V3.
- `/admin` : gestion des accès, réservée aux administrateurs.

La navigation est commune à toutes les pages. Sur mobile, elle devient une
barre compacte.

Pour la route `/`, l’utilisateur non authentifié voit la présentation publique ;
l’utilisateur authentifié accède à son cockpit.

## 10. Expérience d’interface retenue

L’interface combine un tableau de bord personnel et un explorateur analytique
séparé. Les anciennes options de dashboard sont abandonnées au profit de cette
direction unique.

### Cockpit personnel

Le cockpit répond d’abord à la question « où en suis-je ? ». Il affiche :

- la situation professionnelle actuelle ;
- la date de dernière actualisation ;
- une invitation à actualiser les données devenues anciennes ;
- la position de l’alumni face à des profils comparables ;
- les changements depuis la situation précédente ;
- quelques tendances communautaires essentielles ;
- l’action principale « Actualiser ma situation ».

Le cockpit reste synthétique et ne duplique pas l’explorateur.

### Profils comparables

Le cockpit construit automatiquement le groupe de comparaison selon cet ordre :

1. même métier ;
2. niveau de séniorité ou expérience proche ;
3. même zone géographique ;
4. même temps de travail ;
5. secteur et taille d’entreprise comme affinements.

Sous le seuil de trois alumni distincts, l’application élargit progressivement
d’abord au domaine professionnel, puis la zone géographique, le secteur et
enfin l’expérience. Les critères réellement appliqués sont toujours indiqués à
l’utilisateur.

### Explorateur de données

L’explorateur répond à la question « que montre la communauté ? ».

Il comprend :

- une synthèse avec médiane, moyenne, rémunération totale et évolution ;
- des onglets : rémunération, métiers, secteurs, géographie et avantages ;
- des filtres persistants dans un panneau latéral sur ordinateur ;
- les mêmes filtres dans un tiroir sur mobile ;
- un choix entre « situations actuelles » et « historique » ;
- des graphiques accompagnés d’une courte interprétation ;
- le masquage automatique des résultats sous le seuil de trois alumni
  distincts.

### Boîte à idées

- La boîte à idées n’est plus intégrée ou flottante dans le cockpit.
- Elle dispose de sa propre page `/idees`.
- Les fonctionnalités existantes de création, vote et gestion sont conservées.

## 11. Évaluateur d’offres

### Saisie

La première version utilise un formulaire structuré reprenant :

- le poste et le niveau de séniorité ;
- le secteur et la localisation ;
- le contrat et le temps de travail ;
- le salaire fixe et la rémunération variable ;
- le télétravail et les avantages.

La comparaison utilise uniquement les données de la plateforme, sans IA ni
service d’extraction payant.

### Résultat

Le résultat :

- situe le fixe et la rémunération totale dans l’échantillon ;
- affiche la médiane, une fourchette et le nombre d’alumni comparables ;
- compare le télétravail, le temps de travail et les avantages disponibles ;
- indique un niveau de confiance lié à la taille et à la proximité de
  l’échantillon ;
- qualifie l’offre comme « plutôt inférieure », « dans la norme » ou « plutôt
  supérieure ».

Sous trois alumni comparables, le résultat est masqué et l’interface propose
d’élargir les critères.

Une mention rappelle qu’il s’agit d’un repère communautaire et non d’une
évaluation absolue.

## 12. Critères de réussite de la V1

La V1 est prête au lancement lorsque :

- un alumni autorisé peut activer son compte, créer son mot de passe Firebase
  et retrouver une session applicative persistante ;
- il peut créer plusieurs activités, ajouter des relevés, confirmer une
  situation inchangée et consulter son historique ;
- le cockpit choisit automatiquement des profils comparables ;
- l’explorateur applique les filtres, les seuils de confidentialité et la
  transition entre données historiques et données récentes ;
- l’import D1 reproduit les statistiques historiques attendues et fournit un
  rapport de contrôle ;
- l’administrateur peut gérer les accès, taxonomies, invitations et rappels ;
- la boîte à idées fonctionne sur `/idees` ;
- aucune interface ni API ne permet d’obtenir un salaire individuel ;
- les parcours principaux fonctionnent sur mobile et au clavier ;
- les tests, le typage, le lint et le build OpenNext passent ;
- le déploiement ne nécessite l’activation d’aucune offre payante.

L’objectif d’adoption à trois mois est d’obtenir au moins huit profils récents
dans chacun des trois principaux domaines professionnels observés dans les
données historiques.

## 13. Décisions ouvertes

Aucune décision produit structurante ne reste ouverte à l’issue de ce cadrage.
Les choix d’implémentation détaillés seront précisés dans la conception
technique de la V1.
