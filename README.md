# Gestion Conciergerie — Nover Invoice

Projet unique regroupant toute la planification et le code produits pour l'application de facturation de la conciergerie Airbnb (Nover Clean / Nova Immo).

## Structure

```
gestion-conciergerie/
├── docs/                          → planification (à lire avant le code)
│   ├── 01-architecture.md         → architecture technique complète
│   ├── 02-data-model.md           → modèle de données + schéma Prisma expliqué
│   └── 03-flows-api-backlog.md    → parcours utilisateurs, API, backlog MVP/V2/V3
│
└── web/                           → code de l'application (Next.js + Prisma)
    ├── README.md                  → instructions de démarrage et limitations connues
    ├── prisma/schema.prisma       → schéma de base de données complet
    ├── prisma/seed.ts             → données de démonstration
    ├── src/modules/               → logique métier (TVA, commission, import, facturation)
    ├── src/app/                   → pages (dashboard, propriétaires, logements, factures)
    └── src/lib/                   → RBAC, audit log, clients Prisma/Supabase
```

## Démarrage rapide

Voir `web/README.md` pour les instructions détaillées. En résumé :

```bash
cd web
npm install
npx prisma generate
# copier .env.example en .env et renseigner DATABASE_URL (Supabase)
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

## État d'avancement

MVP en cours — voir `docs/03-flows-api-backlog.md` pour le détail des items faits/à faire. Les moteurs critiques (résolution TVA mixte, calcul de commission sur loyer net) sont couverts par des tests unitaires (`npm run test` dans `web/`).
