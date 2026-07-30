Status: ready-for-agent

# Plateforme alumni V1

## Problem Statement

L’association dispose aujourd’hui d’un sondage ponctuel sur les situations
professionnelles de ses alumni. Les réponses sont anonymes, lues depuis Google
Sheets et impossibles à actualiser individuellement. Elles vieillissent donc
sans que l’association puisse distinguer un parcours toujours valide d’une
situation obsolète.

L’accès à l’application repose en outre sur un mot de passe collectif. Les
comparaisons personnelles sont conservées dans le navigateur et les idées dans
une base séparée. Cette organisation ne permet ni historique professionnel
fiable, ni contrôle individuel des données, ni administration fine des accès.

L’association veut obtenir des statistiques plus fraîches sans exposer les
rémunérations individuelles et sans coût récurrent. Chaque alumni doit pouvoir
maintenir ses activités professionnelles et ses relevés de situation, tandis
que les anciennes réponses doivent continuer à alimenter le lancement sans
être attribuées artificiellement à des comptes.

## Solution

La V1 transforme le sondage en un espace privé et longitudinal.

Chaque adresse autorisée peut activer un compte au moyen d’un code reçu par
email, choisir un mot de passe et se connecter ensuite sans nouvel email.
L’alumni maintient un profil, une ou plusieurs activités professionnelles et
des relevés de situation datés. Il peut confirmer en un clic qu’une situation
n’a pas changé.

L’accueil authentifié devient un cockpit personnel. Un explorateur séparé
présente les rémunérations, métiers, secteurs d’activité, géographies et
avantages sous forme d’agrégats interprétés. Une statistique actuelle n’est
affichée qu’à partir de trois alumni distincts.

Les réponses du sondage existant sont importées une fois comme historique
anonyme. Elles restent séparées des nouvelles contributions et s’effacent
progressivement de la vue principale quand un segment atteint huit profils
récents.

L’administration gère les adresses autorisées, invitations, suspensions,
rappels, taxonomies et demandes de suppression, sans pouvoir consulter ni
modifier les rémunérations individuelles.

## User Stories

### Accès public et activation

1. En tant que visiteur, je veux comprendre la finalité de la plateforme, afin
   de savoir pourquoi je devrais contribuer.
2. En tant que visiteur, je veux voir qu’aucune donnée communautaire n’est
   affichée publiquement, afin que la confidentialité soit évidente.
3. En tant que visiteur, je veux être invité à me connecter, afin d’accéder aux
   données réservées aux alumni.
4. En tant qu’alumni autorisé, je veux demander l’activation avec mon adresse
   email, afin de créer mon compte.
5. En tant qu’alumni, je veux recevoir une réponse neutre à ma demande
   d’activation, afin que la liste des adresses autorisées ne puisse pas être
   énumérée.
6. En tant qu’alumni autorisé, je veux recevoir un code à six chiffres valable
   dix minutes, afin de prouver que je contrôle l’adresse email.
7. En tant qu’alumni autorisé, je veux qu’un code ne soit utilisable qu’une
   fois, afin qu’un ancien message ne permette pas une seconde activation.
8. En tant qu’alumni autorisé, je veux choisir un mot de passe après la
   vérification de mon adresse, afin que les connexions suivantes ne consomment
   pas le quota email.
9. En tant qu’alumni non autorisé, je veux recevoir la même apparence de
   réponse qu’un alumni autorisé, afin que la confidentialité de la liste soit
   préservée.
10. En tant qu’association, je veux limiter les demandes et tentatives
    d’activation abusives, afin de protéger le quota email et les comptes.
11. En tant qu’alumni, je veux que les contrôles anti-robot soient validés côté
    serveur, afin qu’ils ne puissent pas être contournés par un appel direct.

### Connexion et sessions

12. En tant qu’alumni activé, je veux me connecter avec mon email et mon mot de
    passe, afin d’accéder à mon espace sans recevoir d’email.
13. En tant qu’alumni, je veux rester connecté sur mon appareil, afin de ne pas
    ressaisir régulièrement mes identifiants.
14. En tant qu’alumni, je veux que ma session expire après quinze mois
    d’inactivité, afin de concilier confort et sécurité.
15. En tant qu’alumni, je veux me déconnecter de l’appareil courant, afin de
    fermer immédiatement son accès.
16. En tant qu’alumni, je veux voir mes sessions ouvertes, afin d’identifier
    les appareils encore connectés.
17. En tant qu’alumni, je veux révoquer une autre session, afin de sécuriser un
    appareil perdu ou partagé.
18. En tant qu’alumni, je veux fermer toutes mes sessions, afin de reprendre le
    contrôle de mon compte.
19. En tant qu’alumni suspendu, je veux que mes sessions existantes cessent de
    fonctionner, afin que la suspension soit effective immédiatement.
20. En tant qu’alumni, je veux récupérer mon mot de passe après une nouvelle
    vérification de mon adresse, afin de retrouver mon compte sans intervention
    arbitraire de l’administration.
21. En tant qu’alumni, je veux qu’une action sensible demande une
    réauthentification récente, afin qu’une session abandonnée ne suffise pas.

### Profil alumni

22. En tant qu’alumni, je veux renseigner mon année de diplôme, afin de
    contribuer aux comparaisons par cohorte.
23. En tant qu’alumni, je veux renseigner facultativement ma spécialité et mes
    diplômes complémentaires, afin de décrire mon parcours sans alourdir la
    saisie obligatoire.
24. En tant qu’alumni, je veux indiquer facultativement ma disponibilité pour
    le recrutement ou le mentorat, afin de préparer de futurs usages
    communautaires.
25. En tant qu’alumni, je veux désactiver les rappels d’actualisation, afin de
    contrôler les emails reçus.
26. En tant qu’alumni, je veux corriger les informations de mon profil, afin
    qu’elles restent exactes.
27. En tant qu’alumni, je veux que mon profil reste absent de tout annuaire par
    défaut, afin qu’aucune information nominative ne soit publiée sans accord.

### Activités professionnelles

28. En tant qu’alumni, je veux créer une activité professionnelle, afin de
    représenter une période continue dans un métier et une organisation
    employeuse.
29. En tant qu’alumni, je veux sélectionner un domaine professionnel puis un
    métier normalisé, afin que mon activité soit comparable sans perdre mon
    intitulé de poste réel.
30. En tant qu’alumni, je veux saisir mon intitulé de poste, afin de conserver
    le libellé utilisé par mon organisation employeuse.
31. En tant qu’alumni, je veux indiquer ma relation de travail, afin de
    distinguer CDI, fonction publique, indépendance, alternance et autres
    cadres.
32. En tant qu’alumni, je veux dater le début et la fin d’une activité, afin de
    représenter mon parcours.
33. En tant qu’alumni, je veux conserver une activité sans employeur renseigné,
    afin de pouvoir contribuer sans divulguer cette information facultative.
34. En tant qu’alumni, je veux avoir plusieurs activités simultanées, afin de
    représenter par exemple un emploi salarié et une activité indépendante.
35. En tant qu’alumni, je veux désigner une seule activité ouverte comme
    principale, afin que mon cockpit dispose d’un point de référence.
36. En tant qu’alumni, je veux clôturer une activité lors d’un changement
    d’employeur ou de métier, afin de ne pas confondre deux périodes distinctes.
37. En tant qu’alumni, je veux modifier ou supprimer uniquement mes propres
    activités, afin de garder le contrôle de mes données.

### Relevés de situation

38. En tant qu’alumni, je veux ajouter un relevé de situation daté à une
    activité, afin d’historiser ses conditions à un instant donné.
39. En tant qu’alumni, je veux que la date d’observation soit initialisée au
    jour de la saisie, afin d’accélérer le formulaire.
40. En tant qu’alumni, je veux modifier la date d’observation, afin de saisir
    rétrospectivement une évolution.
41. En tant qu’alumni, je veux enregistrer un nouveau relevé après une
    augmentation, afin de conserver l’historique sans créer un faux nouvel
    emploi.
42. En tant qu’alumni, je veux renseigner ma séniorité séparément de ma
    responsabilité professionnelle, afin qu’Expert, Lead et Manager ne soient
    pas confondus.
43. En tant qu’alumni, je veux renseigner mon expérience totale et mon
    expérience dans le métier, afin d’améliorer les profils comparables.
44. En tant qu’alumni, je veux décrire la nature, l’effectif et le stade de mon
    organisation employeuse séparément, afin d’éviter les catégories ambiguës
    telles que PME ou hôpital.
45. En tant qu’alumni du public, je veux pouvoir associer une nature
    d’organisation publique à un secteur d’activité comme Santé, afin que mon
    organisation soit correctement représentée.
46. En tant qu’alumni, je veux renseigner le pays d’emploi et la région de
    travail séparément de l’organisation du travail, afin que géographie et
    télétravail ne soient pas confondus.
47. En tant qu’alumni, je veux renseigner facultativement ma ville, afin de
    contribuer aux analyses locales sans rendre cette précision obligatoire.
48. En tant qu’alumni, je veux indiquer une organisation sur site, hybride ou
    entièrement à distance, afin de comparer les conditions de travail.
49. En tant qu’alumni, je veux indiquer mon temps de travail, afin que les
    rémunérations réelles et équivalentes temps plein soient distinguées.
50. En tant qu’alumni, je veux saisir le salaire fixe et le variable dans leur
    devise d’origine, afin que ma déclaration exacte soit conservée.
51. En tant qu’alumni, je veux que la conversion en euros utilise le taux
    correspondant à la date d’observation, afin que la comparaison soit
    explicable.
52. En tant qu’alumni, je veux que les conversions et équivalents temps plein
    n’écrasent jamais ma valeur originale, afin de pouvoir vérifier les
    calculs.
53. En tant qu’alumni, je veux corriger ou supprimer uniquement mes propres
    relevés, afin de garder le contrôle de mon historique.
54. En tant qu’alumni, je veux confirmer en un clic qu’une activité n’a pas
    changé, afin d’actualiser sa fraîcheur sans ressaisir le formulaire.
55. En tant qu’alumni, je veux qu’une confirmation ne crée pas un relevé
    identique supplémentaire, afin que l’historique reste fidèle.

### Avantages et taxonomies

56. En tant qu’alumni, je veux sélectionner des avantages normalisés, afin de
    contribuer à des statistiques comparables.
57. En tant qu’alumni, je veux préciser le nombre de jours de télétravail, afin
    de comparer concrètement les pratiques.
58. En tant qu’alumni, je veux préciser la valeur et la part employeur des
    tickets restaurant, afin de décrire correctement cet avantage.
59. En tant qu’alumni, je veux préciser les jours de RTT ou congés
    supplémentaires, afin de comparer le temps disponible.
60. En tant qu’alumni, je veux préciser le montant de l’intéressement ou de la
    participation, afin de compléter la rémunération totale.
61. En tant qu’alumni, je veux saisir un avantage « autre », afin de ne pas
    perdre une situation absente de la taxonomie.
62. En tant qu’alumni, je veux voir une suggestion lorsqu’un libellé « autre »
    ressemble à une catégorie existante, afin d’éviter un doublon.
63. En tant qu’alumni, je veux confirmer moi-même une suggestion, afin
    qu’aucune classification approximative ne soit appliquée silencieusement.
64. En tant qu’administrateur, je veux qualifier les valeurs « autre », afin
    d’améliorer progressivement les taxonomies.
65. En tant qu’administrateur, je veux prévisualiser une reclassification
    rétroactive, afin d’en mesurer les effets avant confirmation.
66. En tant qu’administrateur, je veux annuler une reclassification, afin de
    corriger une erreur de taxonomie.

### Fraîcheur et rappels

67. En tant qu’alumni, je veux voir la date de dernière actualisation de ma
    situation actuelle, afin de savoir si une confirmation est nécessaire.
68. En tant qu’alumni, je veux qu’un relevé de douze mois ou moins soit
    considéré comme récent, afin que la notion de fraîcheur soit prévisible.
69. En tant qu’alumni, je veux qu’un relevé âgé de douze à trente-six mois soit
    signalé « à confirmer », afin de pouvoir le valider ou le corriger.
70. En tant qu’alumni, je veux qu’un relevé de plus de trente-six mois quitte
    les statistiques actuelles, afin que les comparaisons ne reposent pas sur
    des situations trop anciennes.
71. En tant qu’administrateur, je veux configurer les échéances de rappel, afin
    d’adapter la politique d’actualisation.
72. En tant qu’administrateur, je veux voir les rappels éligibles et futurs,
    afin de comprendre ce que le système va envoyer.
73. En tant qu’administrateur, je veux plafonner les rappels quotidiens, afin de
    préserver le quota pour les emails prioritaires.
74. En tant qu’administrateur, je veux mettre les rappels en pause, afin de
    reprendre le contrôle sans supprimer leur configuration.
75. En tant qu’administrateur, je veux que les lots partent automatiquement
    après activation de la configuration, afin de ne pas valider manuellement
    chaque envoi.
76. En tant qu’administrateur, je veux consulter le journal des envois et des
    erreurs, afin de diagnostiquer les problèmes de livraison.

### Cockpit personnel

77. En tant qu’alumni, je veux retrouver ma situation actuelle dès l’accueil
    authentifié, afin de comprendre immédiatement l’état de mon profil.
78. En tant qu’alumni, je veux voir les changements depuis mon relevé
    précédent, afin de mesurer mon évolution.
79. En tant qu’alumni, je veux me situer face à des profils comparables, afin de
    donner du contexte à ma situation sans voir de données individuelles.
80. En tant qu’alumni, je veux voir quelques tendances communautaires
    essentielles dans mon cockpit, afin d’obtenir une synthèse avant
    d’explorer.
81. En tant qu’alumni, je veux être encouragé à compléter uniquement les
    informations manquantes utiles, afin que la contribution reste progressive.

### Explorateur

82. En tant qu’alumni authentifié, je veux accéder à un explorateur séparé,
    afin d’analyser librement les données communautaires.
83. En tant qu’alumni, je veux voir la médiane, la moyenne, la rémunération
    totale et l’évolution, afin de disposer d’une synthèse complète.
84. En tant qu’alumni, je veux explorer des onglets Rémunération, Métiers,
    Secteurs, Géographie et Avantages, afin de structurer mes recherches.
85. En tant qu’alumni sur ordinateur, je veux conserver les filtres dans un
    panneau latéral, afin de modifier rapidement un segment.
86. En tant qu’alumni sur mobile, je veux retrouver les filtres dans un tiroir,
    afin que les graphiques gardent suffisamment de place.
87. En tant qu’alumni, je veux que mes filtres persistent entre les onglets,
    afin de comparer le même segment.
88. En tant qu’alumni, je veux choisir entre situations actuelles et historique,
    afin de ne pas confondre les périodes.
89. En tant qu’alumni, je veux lire une courte interprétation auprès de chaque
    graphique, afin de comprendre ce qu’il montre et ses limites.
90. En tant qu’alumni, je veux connaître la taille de l’échantillon, afin
    d’évaluer la solidité d’une comparaison.
91. En tant qu’alumni, je veux qu’un segment actuel de moins de trois personnes
    soit masqué, afin de protéger les contributeurs.
92. En tant qu’alumni, je veux que le seuil porte sur les personnes distinctes
    et non sur leurs relevés, afin qu’un historique riche ne contourne pas la
    confidentialité.
93. En tant qu’alumni, je veux que les données historiques estimées soient
    signalées, afin de ne pas les confondre avec les montants exacts récents.
94. En tant qu’alumni, je veux voir uniquement la référence historique quand un
    segment contient zéro à deux profils récents, afin que l’explorateur ne
    soit pas vide.
95. En tant qu’alumni, je veux voir actuel et historique côte à côte entre
    trois et sept profils récents, afin de comprendre que l’échantillon actuel
    reste limité.
96. En tant qu’alumni, je veux que les données actuelles deviennent
    principales à partir de huit profils récents, afin que la plateforme
    privilégie progressivement les contributions fraîches.
97. En tant qu’alumni, je veux choisir entre rémunération perçue et équivalent
    temps plein, afin de comparer des situations cohérentes.

### Administration

98. En tant qu’administrateur, je veux importer une liste d’adresses
    autorisées, afin d’ouvrir l’accès aux alumni connus.
99. En tant qu’administrateur, je veux voir quels comptes sont éligibles,
    actifs, suspendus ou en suppression, afin de gérer les accès.
100. En tant qu’administrateur, je veux suspendre un compte, afin de bloquer un
     accès sans modifier ses données professionnelles.
101. En tant qu’administrateur, je veux programmer des invitations aux comptes
     non activés, afin d’élargir progressivement la participation.
102. En tant qu’administrateur, je veux configurer un plafond quotidien
     d’invitations distinct, afin de préserver les emails transactionnels.
103. En tant qu’administrateur, je veux programmer au plus une relance
     facultative, afin de solliciter sans harceler.
104. En tant qu’administrateur, je veux consulter les opérations sensibles
     journalisées, afin de disposer d’une traçabilité.
105. En tant qu’administrateur, je veux ne jamais recevoir de salaire ou
     d’avantage individuel dans les réponses d’administration, afin que mon
     rôle ne donne pas accès à ces données.
106. En tant qu’administrateur, je veux être techniquement empêché de modifier
     les activités et relevés d’un alumni, afin de préserver la propriété des
     contributions.

### Suppression et anonymisation

107. En tant qu’alumni, je veux demander la suppression de mon compte depuis
     mon profil, afin d’exercer mon droit sans procédure opaque.
108. En tant qu’alumni, je veux voir que ma demande doit être traitée sous un
     mois, afin de connaître son échéance.
109. En tant qu’administrateur, je veux voir les demandes et leur date limite,
     afin de les traiter dans le délai prévu.
110. En tant qu’alumni supprimé, je veux que mon compte, mes sessions, mes
     consentements et mes données directement identifiantes disparaissent, afin
     que je ne reste pas accessible.
111. En tant qu’ancien membre, je veux que mes idées éventuellement conservées
     ne soient plus reliées à mon identité, afin de préserver ma vie privée.
112. En tant qu’association, je veux ne conserver une contribution
     professionnelle qu’après anonymisation irréversible, afin de maintenir des
     historiques sans conserver de donnée personnelle.
113. En tant qu’association, je veux supprimer toute contribution encore
     raisonnablement réidentifiable, afin que la conservation statistique ne
     prime pas sur la confidentialité.

### Reprise des données et boîte à idées

114. En tant qu’association, je veux importer une copie immuable du sondage
     historique, afin de lancer la plateforme avec des références utiles.
115. En tant qu’association, je veux que chaque import soit identifié par sa
     source et son empreinte, afin de pouvoir le reproduire et l’auditer.
116. En tant qu’administrateur, je veux recevoir un rapport des lignes
     importées, ignorées et invalides, afin de valider la qualité de la reprise.
117. En tant qu’alumni, je veux qu’aucune ancienne réponse ne soit attribuée à
     mon compte, afin d’éviter une association incertaine.
118. En tant qu’association, je veux comparer les distributions avant et après
     l’import, afin de détecter une normalisation incorrecte.
119. En tant qu’utilisateur authentifié, je veux retrouver la boîte à idées sur
     une page dédiée, afin qu’elle ne surcharge plus le cockpit.
120. En tant qu’auteur, je veux modifier ou supprimer uniquement mes propres
     idées selon les règles existantes, afin de conserver leur contrôle.
121. En tant qu’utilisateur, je veux voter une seule fois pour une idée, afin
     que le classement reste équitable.
122. En tant qu’association, je veux que les idées et votes utilisent les
     identifiants de compte plutôt que les emails fournis par le client, afin
     de sécuriser leur propriété.

## Implementation Decisions

### Architecture et source de vérité

- La V1 conserve Next.js, React et TypeScript, déployés sur Cloudflare Workers
  au moyen d’OpenNext.
- Une base Cloudflare D1 unifiée devient la source de vérité pour les comptes
  métier, profils, activités professionnelles, relevés de situation,
  confirmations, taxonomies, consentements, emails, idées et journaux.
- Les réponses historiques sont importées dans la même base mais restent dans
  un modèle séparé, sans relation vers un compte.
- Google Sheets devient une archive externe en lecture seule après validation
  de la reprise.
- Les migrations sont appliquées successivement en local, en préproduction puis
  en production. Les identifiants de ressources distantes ne sont jamais
  inventés dans le dépôt.
- Les fondations D1, les types de compte, les dépôts de compte et session et les
  primitives de jeton opaque déjà amorcés doivent être audités puis étendus,
  et non recréés sous une architecture concurrente.

### Identité, activation et session

- La whitelist crée des comptes métier éligibles avant leur activation.
- Firebase Authentication vérifie uniquement les identifiants email et mot de
  passe. Il ne reçoit aucune donnée de carrière.
- D1 conserve le lien vers l’identité Firebase, le rôle, l’état du compte et
  les sessions applicatives, mais aucun hash de mot de passe.
- Resend envoie le code à six chiffres de première activation, de récupération
  et de changement d’adresse.
- Turnstile est validé côté serveur pour les surfaces exposées aux abus.
- Les réponses d’activation et de récupération ne révèlent jamais si une
  adresse appartient à la whitelist.
- Les codes sont stockés sous forme d’empreinte, expirent après dix minutes,
  ont un nombre limité de tentatives et sont consommés atomiquement.
- Après une authentification Firebase réussie, le serveur crée un jeton
  aléatoire d’au moins 256 bits. Seule son empreinte enrichie d’un secret
  d’environnement est stockée dans D1.
- Le navigateur reçoit un cookie `__Host-` limité au chemin racine, `HttpOnly`,
  `Secure` et `SameSite=Lax`.
- La session expire quinze mois après la dernière activité. La persistance de
  la nouvelle échéance est limitée à une écriture par fenêtre de vingt-quatre
  heures.
- Le compte D1 est vérifié à chaque résolution de session. Une suspension ou
  suppression rend donc immédiatement les sessions inutilisables.
- Les mutations utilisent une protection CSRF fondée sur l’origine et un jeton
  dédié, en complément du comportement `SameSite`.
- Les actions sensibles exigent une preuve Firebase récemment
  réauthentifiée.

### Modèle du parcours professionnel

- Une activité professionnelle représente une période continue dans un métier
  et une organisation employeuse.
- Un relevé de situation capture les conditions datées d’une activité. Les
  variations de rémunération, temps de travail ou avantages ajoutent un relevé
  sans créer une nouvelle activité.
- Un changement de métier ou d’organisation employeuse clôture l’activité
  précédente et en ouvre une nouvelle.
- Une confirmation de situation est un événement séparé. Elle met à jour la
  fraîcheur sans dupliquer le relevé.
- Plusieurs activités peuvent être ouvertes simultanément, avec au plus une
  activité principale.
- Les invariants impliquant plusieurs écritures sont protégés par des
  transactions D1.
- Les autorisations partent toujours de l’identifiant de compte issu de la
  session. Aucun identifiant de propriétaire fourni par le client n’est
  accepté comme source d’autorité.
- Les champs d’entrée sont validés explicitement et les champs inconnus sont
  refusés.

### Rémunération et conditions

- Les montants originaux sont conservés dans l’unité mineure de leur devise.
- La valeur annuelle en euros, le taux de change, sa date et sa source sont
  conservés comme données dérivées auditables.
- L’équivalent temps plein est une seconde valeur dérivée qui ne remplace
  jamais le montant réellement perçu.
- Un variable nul est différent d’un variable inconnu.
- Les champs de rémunération ne sont obligatoires que lorsqu’ils sont
  pertinents pour la relation de travail.
- Les données de salaire, variable et avantages individuels ne sont retournées
  qu’à leur propriétaire dans les parcours de contribution.

### Taxonomies

- Les domaines professionnels, métiers, secteurs d’activité et avantages
  utilisent des identifiants stables et des libellés administrables.
- Le métier est distinct du domaine professionnel et de l’intitulé de poste.
- La nature de l’organisation, son effectif, son stade et son secteur
  d’activité sont des dimensions indépendantes.
- Le management n’est pas un domaine professionnel. Il est représenté par la
  responsabilité professionnelle, la séniorité et la taille d’équipe.
- Une valeur « autre » conserve son texte d’origine et crée une proposition de
  qualification.
- Une correspondance approximative ne peut être qu’une suggestion explicite.
- Les reclassifications administratives sont prévisualisables, journalisées et
  annulables.
- La normalisation textuelle existante est réservée à l’import historique après
  renforcement de ses règles et tests.

### Fraîcheur

- Le dernier relevé ou la dernière confirmation détermine la fraîcheur d’une
  activité ouverte.
- Jusqu’à douze mois, la situation actuelle est récente.
- De douze à trente-six mois, elle reste actuelle mais est signalée « à
  confirmer ».
- Au-delà de trente-six mois, elle est exclue des statistiques actuelles et
  reste uniquement historique.

### Statistiques et confidentialité

- L’explorateur renvoie uniquement des agrégats, jamais une collection de
  relevés individuels.
- Tous les filtres sont appliqués avant le contrôle du seuil.
- Une statistique actuelle exige au moins trois identifiants de compte
  distincts. Plusieurs relevés d’un même alumni ne peuvent pas satisfaire le
  seuil.
- Pour un segment et une date de référence, un seul relevé pertinent par alumni
  participe aux agrégats.
- Les dimensions combinables sont placées sur liste blanche. Les dates,
  expériences, effectifs et géographies utilisent des tranches fixes.
- Les montants agrégés sont arrondis et les facettes rares supprimées pour
  réduire les attaques par différence.
- Les réponses statistiques sont privées, non stockables en cache partagé et
  soumises à limitation de débit.
- Entre zéro et deux profils récents, seule la référence historique est
  affichée.
- Entre trois et sept profils récents, actuel et historique sont affichés
  séparément avec un avertissement.
- À partir de huit profils récents, l’actuel devient la référence principale
  et l’historique une comparaison facultative.
- Les valeurs représentatives dérivées d’anciennes tranches restent signalées
  comme estimations.

### Expérience et navigation

- La route publique ne contient aucune statistique et présente la finalité du
  service ainsi que l’accès au compte.
- La même route devient le cockpit personnel après authentification.
- Le cockpit rassemble la situation actuelle, sa fraîcheur, les évolutions
  personnelles, une position agrégée face à des profils comparables et quelques
  tendances communautaires.
- L’explorateur est une page distincte avec synthèse, onglets thématiques,
  interprétations et filtres persistants.
- Les filtres utilisent un panneau latéral sur ordinateur et un tiroir sur
  mobile.
- La contribution et l’historique personnel disposent d’un espace dédié.
- La boîte à idées devient une page dédiée.
- L’interface reste mobile-first et doit conserver une navigation accessible
  au clavier et aux technologies d’assistance.

### Administration et emails

- Les opérations administratives exigent le rôle `admin` porté par le compte
  D1 et une réauthentification récente.
- Les contrats administratifs n’exposent aucun salaire ou avantage individuel.
- L’administration ne possède aucun contrat permettant de modifier une
  activité professionnelle ou un relevé de situation d’un alumni.
- Les invitations, codes, récupérations et rappels sont placés dans une file
  idempotente avec priorité, tentatives et journal de livraison.
- Un gestionnaire planifié OpenNext traite de petits lots et respecte le quota
  fournisseur.
- Les plafonds des invitations et rappels sont distincts. Une réserve
  configurable est toujours conservée pour les emails transactionnels.
- Une fois les campagnes ou rappels activés, les lots partent sans validation
  manuelle.
- Les opérations sensibles, décisions de taxonomie, changements d’accès et
  suppressions sont consignés dans un journal d’audit.

### Suppression

- La demande de suppression possède une échéance administrative d’un mois.
- Le traitement révoque les sessions et supprime le compte, les consentements
  et toutes les données directement identifiantes.
- Les idées conservées perdent leur auteur ; les votes du compte sont
  supprimés.
- Une contribution professionnelle ne peut être conservée qu’après copie
  généralisée et irréversiblement dissociée du compte, sans employeur, ville,
  intitulé ou texte libre.
- Une contribution encore raisonnablement réidentifiable est supprimée.
- Une contribution anonymisée issue d’une suppression est exclusivement
  historique.

### Migration et bascule

- L’import de la whitelist est idempotent et normalise les emails.
- La reprise du sondage historique est reproductible à partir d’une source
  identifiée par une empreinte SHA-256.
- L’import conserve les valeurs brutes, les valeurs normalisées et un rapport
  des anomalies.
- Les idées et votes sont migrés des emails vers les identifiants des comptes
  éligibles. Les adresses sans correspondance sont signalées au lieu de créer
  silencieusement un compte.
- Les effectifs, distributions et agrégats sont comparés à l’application
  existante avant bascule.
- La recette autorise une période courte de double lecture, mais la production
  bascule ensuite entièrement sur D1.
- Le mot de passe collectif, les JWT stockés dans le navigateur et la lecture
  Google Sheets sont retirés après validation.
- Un export de sauvegarde précède la bascule et les anciennes sources restent
  en lecture seule pendant la période de retour arrière.

## Testing Decisions

### Principes

- Les tests vérifient des comportements observables plutôt que la structure
  interne des dépôts, composants ou requêtes SQL.
- Les scénarios sont écrits avec les termes du modèle de domaine : activité
  professionnelle, relevé de situation, situation actuelle, métier, secteur
  d’activité et organisation employeuse.
- Chaque ticket d’implémentation suit une boucle rouge, verte puis
  restructuration, à une frontière convenue.
- Un test de régression accompagne chaque défaut découvert.

### Frontière principale : API avec D1 locale

- La majorité des comportements est testée à travers les contrats HTTP de
  l’application.
- Les tests utilisent une vraie base D1 locale initialisée par les migrations
  de production.
- Firebase, Resend, Turnstile et la source de taux de change sont remplacés par
  des doubles explicites et déterministes.
- Les tests couvrent réponses, statuts HTTP, cookies, effets persistés et
  autorisations, sans affirmer la forme interne des requêtes.
- Les scénarios d’activation couvrent adresse autorisée ou inconnue, code
  expiré, code déjà consommé, tentatives dépassées, erreur Firebase et reprise
  après échec partiel.
- Les scénarios de session couvrent expiration, glissement, révocation,
  suspension, suppression et réauthentification récente.
- Les scénarios de contribution vérifient la propriété, les activités
  simultanées, l’unicité de l’activité principale, l’historisation et la
  confirmation sans duplication.
- Les scénarios de statistiques utilisent explicitement des jeux de 2, 3, 7 et
  8 alumni distincts.
- Un jeu contient plusieurs relevés du même alumni afin de vérifier qu’il ne
  compte qu’une fois pour le seuil.
- Des requêtes par filtres voisins vérifient le masquage des petites facettes et
  la résistance élémentaire aux différences.
- Les scénarios de suppression vérifient à la fois les cascades et l’absence de
  lien résiduel vers une contribution anonymisée.
- Les scénarios d’email vérifient priorité, réserve quotidienne, idempotence,
  pause, reprise et replanification d’un échec transitoire.
- Les imports sont testés sur des fixtures représentatives, invalides et
  dupliquées, avec comparaison du rapport et des agrégats attendus.

### Frontière complémentaire : navigateur

- Quelques parcours bout en bout seulement couvrent l’intégration entre
  interface, contrats HTTP et état persistant.
- Le premier parcours active un compte, choisit un mot de passe, se reconnecte
  et vérifie le cookie de session.
- Le deuxième crée une activité professionnelle, ajoute un relevé de situation,
  le corrige puis confirme la situation sans nouveau relevé.
- Le troisième navigue du cockpit à l’explorateur, conserve les filtres entre
  les onglets et vérifie l’affichage mobile du tiroir.
- Le quatrième vérifie qu’un segment sous le seuil est masqué et qu’il devient
  visible à trois alumni distincts.
- Le cinquième couvre les opérations administratives essentielles sans jamais
  rendre visible une rémunération individuelle.
- Les parcours vérifient les états de chargement, erreurs récupérables,
  navigation clavier et principaux libellés accessibles.

### Tests unitaires ciblés

- Les fonctions pures complexes conservent des tests unitaires : normalisation
  historique, conversion monétaire, équivalent temps plein, calcul de
  fraîcheur, arrondi statistique et génération ou empreinte des jetons.
- Les composants de présentation simples ne reçoivent pas de tests unitaires
  redondants lorsque leur comportement est déjà couvert au niveau navigateur.
- Les tests Vitest et Testing Library déjà présents servent de référence pour
  la structure des tests unitaires et de contexte.
- Les tests de session et de sécurité déjà commencés sont conservés comme
  régressions de la politique des quinze mois.

### Validation de chaque tranche

- Chaque tranche passe lint, TypeScript strict, tests, formatage et build
  Cloudflare.
- Les migrations sont appliquées sur une base locale vide et sur une base
  représentant la version précédente.
- Les erreurs de clés étrangères et l’intégrité SQLite sont contrôlées après
  migration.
- Les changements de confidentialité font l’objet d’une revue spécifique avant
  intégration.

## Out of Scope

- L’annuaire consultable et la recherche d’alumni sont reportés en V2. La V1
  peut préparer les consentements, mais ne publie aucun profil.
- L’évaluateur permettant de situer une offre est reporté en V3.
- L’extraction automatique d’une annonce ou d’un PDF est reportée à une version
  ultérieure.
- L’envoi d’une campagne massive au lancement est exclu ; le lancement initial
  passe par le groupe de discussion.
- La fusion silencieuse des réponses historiques avec les contributions
  actuelles est exclue.
- Le rattachement manuel ou automatique d’une ancienne réponse à un alumni est
  exclu.
- La modification d’une rémunération individuelle par un administrateur est
  exclue.
- Le stockage d’un hash de mot de passe dans D1 est exclu.
- L’utilisation d’un service payant nécessaire au fonctionnement nominal est
  exclue.
- Une décision juridique définitive sur l’anonymisation n’est pas prise par
  cette spec ; elle doit être validée par l’association avant production.
- Les statistiques publiques sans authentification sont exclues.

## Further Notes

- Les ADR existants imposent D1 comme source de vérité et Firebase uniquement
  comme fournisseur d’identifiants. Toute remise en cause doit passer par un
  nouvel ADR.
- La V1 est considérée fonctionnellement prête lorsqu’un alumni autorisé peut
  activer son compte, maintenir plusieurs activités et relevés, confirmer une
  situation et retrouver son cockpit, tandis que l’explorateur respecte les
  seuils de confidentialité.
- La reprise est prête lorsque le rapport d’import est validé et que les
  statistiques historiques attendues sont reproduites sans dépendance de
  production à Google Sheets.
- L’administration est prête lorsque les accès, invitations, rappels,
  taxonomies et suppressions peuvent être supervisés sans accès aux
  rémunérations individuelles.
- L’objectif de montée en charge est d’atteindre au moins huit profils récents
  dans chacun des trois principaux domaines professionnels au cours des trois
  premiers mois.
- Les points encore nécessaires avant la mise en production sont le domaine
  expéditeur Resend, les devises et régions réellement attendues, la liste des
  administrateurs initiaux, la durée de retour arrière et la validation
  juridique de l’anonymisation.
- La création effective des ressources Firebase, Resend et D1 distantes ainsi
  que l’ajout de leurs secrets relèvent du déploiement, jamais de valeurs
  fictives inscrites dans le dépôt.
