# Nover Invoice — SaaS de facturation conciergerie Airbnb

Scaffold MVP complet : Next.js 15 (App Router) + Prisma + Supabase + Tailwind, conforme à l'architecture décrite dans `/docs`.

## Ce qui est livré dans cette première étape

- **Schéma Prisma complet** (`prisma/schema.prisma`) : société multi-tenant, propriétaires, logements, réservations, ménage, factures/lignes, paiements, audit log.
- **Moteur de résolution TVA mixte** (`src/modules/vat-engine`) — logement > propriétaire > société, avec 6 tests unitaires qui passent.
- **Moteur de commission sur loyer net** (`src/modules/invoicing/commission-engine.ts`) — modes taux fixe et barème progressif, avec 5 tests unitaires qui passent.
- **Import CSV Airbnb** avec normalisation, tolérance de plusieurs alias de colonnes, et rapprochement automatique des logements (`src/modules/bookings-import`).
- **Orchestrateur de facturation mensuelle** combinant commission + ménage + TVA, numérotation légale sans trou (`src/modules/invoicing/generate-monthly-invoice.ts`).
- **Génération PDF** de facture (branding, IBAN, mention légale franchise en base) via `@react-pdf/renderer`, servie par une route API (`/api/invoices/[id]/pdf`).
- **RBAC + audit log** appliqués systématiquement dans les server actions (`src/lib/auth-guard.ts`, `src/lib/audit-log.ts`).
- **Pages UI** : Dashboard, Propriétaires, Logements, Factures (identité visuelle "Nover Invoice" — encre profonde / laiton, Fraunces + Inter).
- **Propriétaires/Logements** : CRUD complet côté serveur (actions + repository + validation Zod), UI de lecture branchée.

## ⚠️ Limitations connues de cette livraison

1. **`npx prisma generate` n'a pas pu être exécuté ici** : mon environnement d'exécution n'a pas accès à `binaries.prisma.sh` (téléchargement du moteur Prisma), en dehors de la liste blanche réseau. Résultat : le client Prisma n'est pas généré, et `npx tsc --noEmit` remonte des erreurs en cascade ("implicitly has an any type") purement liées à cette absence — **elles disparaîtront automatiquement dès que tu lances `npm run prisma:generate` chez toi** (voir ci-dessous).
2. **Aucun déploiement réel n'a été effectué** : pas de projet Supabase, pas de compte Stripe/Resend, pas de déploiement Vercel — je ne peux pas créer ces ressources cloud depuis cet environnement. Le code est prêt à être connecté à tes propres clés.
3. **Authentification** : le guard RBAC (`requireRole`) est écrit et fonctionnel, mais les pages utilisent temporairement une variable `DEMO_COMPANY_ID` en attendant que tu branches la vraie résolution de session (Supabase Auth → table `Membership`). C'est le prochain morceau logique à construire.
4. Les formulaires de création (propriétaire, logement) ne sont pas encore branchés à l'UI — les server actions et la validation existent (`createOwnerAction`, `createPropertyAction`) mais les boutons "Ajouter..." sont pour l'instant des placeholders visuels.
5. **V2/V3** (relances auto, Stripe/GoCardless, exports comptables, Factur-X/PEPPOL, assistant IA, PWA...) ne sont pas commencés — backlog détaillé dans `docs/03-flows-api-backlog.md`.

## Démarrage chez toi

```bash
cd web
npm install
npx prisma generate        # fonctionnera avec un accès réseau normal
# Configure .env (copier .env.example) avec ton DATABASE_URL Supabase
npx prisma migrate dev --name init
npm run prisma:seed        # crée une société + propriétaire + logement + 2 réservations de démo
npm run dev
```

Copie le `companyId` affiché par le seed dans `DEMO_COMPANY_ID` (fichier `.env`) pour voir les pages se remplir.

Lancer les tests unitaires (moteurs TVA + commission) :
```bash
npm run test
```

## Prochaines étapes suggérées

1. Brancher Supabase Auth réel (remplacer `DEMO_COMPANY_ID` par la résolution de session).
2. Formulaires de création/édition (propriétaires, logements) avec `react-hook-form` + les schémas Zod déjà écrits.
3. Page d'import CSV avec preview de mapping (les actions `previewImportAction`/`confirmImportAction` sont prêtes côté serveur).
4. Bouton "Générer les factures du mois" branché sur `generateAllMonthlyInvoicesAction`.
5. Déploiement Vercel + Supabase.

Voir `/docs` pour l'architecture complète, le modèle de données détaillé et le backlog V2/V3.
