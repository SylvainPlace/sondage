# 14 — Construire l’explorateur

**What to build:** permettre aux alumni authentifiés d’explorer les statistiques
par thème et segment, avec des filtres persistants et des explications adaptées
à la qualité de l’échantillon.

**Blocked by:** 02 — Prototyper et valider l’expérience V1 ; 12 — Produire des
agrégats confidentiels.

**Status:** ready-for-agent

- [ ] L’explorateur présente une synthèse avec médiane, moyenne, rémunération
      totale et évolution.
- [ ] Les onglets Rémunération, Métiers, Secteurs, Géographie et Avantages
      partagent le même état de filtres.
- [ ] Les filtres persistent lors d’un changement d’onglet et peuvent être
      réinitialisés explicitement.
- [ ] Les filtres apparaissent dans un panneau latéral sur ordinateur et un
      tiroir accessible sur mobile.
- [ ] L’alumni peut choisir situations actuelles, historique ou comparaison
      autorisée par la taille du segment.
- [ ] Chaque graphique possède une courte interprétation, la taille de
      l’échantillon et les avertissements d’estimation nécessaires.
- [ ] Un résultat masqué ne laisse voir ni valeur, ni axe, ni facette permettant
      de reconstituer le segment.
- [ ] Le parcours navigateur vérifie la persistance, le responsive, le clavier
      et les seuils de confidentialité.
