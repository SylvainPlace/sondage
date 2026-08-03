# Plateforme alumni NIL

Nouvelle plateforme de suivi des parcours professionnels des alumni NIL. Elle
remplace progressivement l’ancien sondage annuel par des comptes individuels,
des situations datées et des statistiques anonymisées.

## Développement

```bash
npm install
npm run dev
```

Contrôles avant livraison :

```bash
npm run check
npm run build
```

## Documentation

- contexte métier : [`CONTEXT.md`](CONTEXT.md) ;
- conception technique : [`docs/TECHNICAL_DESIGN_V1.md`](docs/TECHNICAL_DESIGN_V1.md) ;
- design system : [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) ;
- décisions : [`docs/adr/`](docs/adr/) ;
- backlog : [`.scratch/alumni-platform-v1/`](.scratch/alumni-platform-v1/).

L’application précédente est conservée en lecture dans
[`legacy/sondage-v0/`](legacy/sondage-v0/) afin de faciliter les comparaisons et
la reprise de logique utile. Elle est exclue du build et des tests actifs.
