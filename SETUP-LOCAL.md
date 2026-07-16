# Setup local — gestion-conciergerie

Prérequis : Docker Desktop, Node.js ≥ 20, npm.

## 1. Cloner le dépôt

```bash
git clone https://github.com/noverbizrk-wq/gestion-conciergerie.git
cd gestion-conciergerie
```

## 2. Démarrer PostgreSQL

Copie `docker-compose.yml` (fourni ci-joint) à la racine du dépôt, puis :

```bash
docker compose up -d
docker compose ps   # attendre que postgres soit "healthy"
```

## 3. Configurer l'app

```bash
cd web
npm install
```

Copie le fichier `.env` (fourni ci-joint) dans `web/.env`. Il pointe déjà vers le PostgreSQL du docker-compose :

```
DATABASE_URL="postgresql://nover:nover@localhost:5432/gestion_conciergerie?schema=public"
```

## 4. Prisma : generate / migrate / seed

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

Le seed affiche un `companyId` dans le terminal — copie-le dans `web/.env` :

```
DEMO_COMPANY_ID="<uuid-affiché-par-le-seed>"
```

## 5. Lancer l'app

```bash
npm run dev
```

Ouvre http://localhost:3000 — le dashboard, propriétaires, logements et factures doivent se remplir avec les données de démo.

## Notes / limitations connues (du README du projet)

- L'auth Supabase réelle n'est pas branchée : les pages utilisent `DEMO_COMPANY_ID` en dur (pas besoin de compte Supabase pour tester en local).
- La route `/api/invoices/[id]/pdf` passe par `requireRole` → `supabase-server.ts`, qui nécessite `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Sans ces variables, le téléchargement PDF de facture plantera ; le reste de l'app (dashboard, listes) fonctionne sans.
- Les boutons "Ajouter propriétaire/logement" sont des placeholders visuels (server actions déjà prêtes côté code).
- Tests unitaires : `npm run test` (moteurs TVA + commission), indépendants de la base.

## Pourquoi je ne l'ai pas fait tourner moi-même

Mon sandbox d'exécution n'a pas Docker, et même en l'installant nativement, tu n'aurais pas pu ouvrir localhost:3000 depuis ton navigateur (environnements séparés). D'où ce guide avec des commandes testées sur la structure réelle du repo (analysé en direct : Next.js 16 + Prisma 7, DATABASE_URL simple, pas de DIRECT_URL requis).
