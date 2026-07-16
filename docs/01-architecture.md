# Nover Invoice — Architecture Complète du SaaS de Facturation Conciergerie Airbnb

## 0. Décisions métier actées

- **Base de calcul de la commission de gestion** : loyer net uniquement, hors frais de ménage et hors taxes de séjour. Chaque réservation importée doit être décomposée en `loyer_net`, `frais_menage`, `taxe_sejour`, `commission_airbnb_plateforme` pour isoler la base commissionnable.
- **Régime de TVA** : mixte, paramétrable par logement **et** par propriétaire (un propriétaire loueur particulier peut être en franchise en base, une SCI/société peut être au réel). Le moteur de facturation doit donc résoudre le taux de TVA applicable au niveau de chaque ligne de facture, avec un ordre de priorité : `override logement` > `réglage propriétaire` > `réglage société par défaut`.

---

## 1. Vue d'ensemble

Application web multi-tenant (multi-société), Next.js (App Router) + Supabase (Postgres, Auth, Storage) + Prisma comme couche ORM/typage, déployée sur Vercel. Architecture en couches façon Clean Architecture adaptée à Next.js :

```
apps/web (Next.js)
 ├─ app/                → routes, layouts, server actions
 ├─ modules/            → logique métier par domaine (DDD léger)
 │   ├─ owners/
 │   ├─ properties/
 │   ├─ bookings-import/
 │   ├─ invoicing/
 │   ├─ cleaning/
 │   ├─ payments/
 │   ├─ vat-engine/
 │   ├─ ai-assistant/
 │   └─ companies/
 ├─ lib/                → clients (prisma, supabase, stripe, resend), utils
 ├─ components/         → UI partagée (shadcn/ui)
 ├─ server/             → server actions "publiques" appelées par l'UI
 └─ prisma/             → schema.prisma, migrations, seed
```

Chaque module métier expose : `service` (logique pure, testable), `repository` (accès Prisma), `dto` (zod schemas), `actions` (server actions Next.js qui font l'orchestration + RBAC + audit log).

### Principes transverses
- **RBAC** appliqué à chaque server action via un middleware `withAuth(role, action)`.
- **Multi-société** : chaque table métier porte une colonne `companyId`; toute requête Prisma passe par un `scopedPrisma(companyId)` pour éviter les fuites de données entre sociétés.
- **Audit log** : table `AuditLog` append-only, écrite automatiquement par un middleware Prisma `$extends`.
- **Validation** : zod partout, un seul schéma source de vérité réutilisé côté formulaire (react-hook-form) et côté server action.

---

## 2. Modules fonctionnels (MVP → V2 → V3)

Voir `03-backlog.md` pour le détail priorisé. Résumé :

**MVP (V1)**
- Auth + RBAC + multi-société de base
- Propriétaires (CRUD + documents)
- Logements (CRUD + commission logement)
- Import CSV Airbnb (mapping + parsing + normalisation)
- Moteur de facturation : commission (loyer net) + ménage
- Moteur TVA mixte (résolution par logement/propriétaire)
- Génération PDF facture (branding, IBAN, QR code de virement)
- Suivi des paiements (statuts manuels)
- Dashboard (CA, factures payées/en attente, TVA, compteurs)

**V2**
- Import Booking/Smoobu/Hostaway/Guesty (adaptateurs par plateforme)
- Facturation en masse (1 clic / mois)
- Relances automatiques (email J+3/J+7/J+15/J+30)
- Paiement en ligne (Stripe, GoCardless)
- Exports comptables (Excel, CSV, Sage/Pennylane/Indy/Cegid/Quadra)
- Gestion des équipes de ménage (planning, photos avant/après, signature)
- Assistant IA (Q&A langage naturel sur la facturation, anomalies)

**V3**
- Facture électronique conforme réforme (Factur-X / UBL / PEPPOL, PDP)
- Signature électronique
- Archivage légal probant
- Rapprochement bancaire
- OCR factures fournisseurs
- Mode PWA, multilingue, dark mode

---

## 3. Stack technique retenue

| Couche | Choix | Justification |
|---|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript | Standard actuel, SSR/Server Actions natifs |
| UI | Tailwind CSS + shadcn/ui + Radix | Composants accessibles, personnalisables sans lock-in |
| ORM | Prisma | Typage fort, migrations, DX |
| DB | PostgreSQL (Supabase) | Relationnel, JSONB pour flexibilité (ex. mapping CSV) |
| Auth | Supabase Auth | RBAC via table `Membership`, JWT custom claims |
| Storage | Supabase Storage | Documents propriétaires, photos ménage, PDF factures |
| PDF | `@react-pdf/renderer` | Génération PDF déclarative en React, contrôle total du design |
| Emails | Resend | API simple, bonne délivrabilité |
| Paiement | Stripe + GoCardless (V2) | Cartes + prélèvement SEPA |
| Validation | zod | Schéma unique partagé front/back |
| Tests | Vitest + Playwright | Unitaire + e2e |
| Déploiement | Vercel (app) + Supabase (DB/Storage/Auth) | Zéro-ops, scaling automatique |

---

## 4. Sécurité (OWASP)

- Toutes les server actions passent par un guard RBAC + vérification `companyId`.
- Row Level Security Postgres en complément du filtrage applicatif (défense en profondeur).
- Validation stricte des entrées (zod) avant toute écriture DB.
- Rate limiting sur les endpoints sensibles (login, import CSV, IA).
- Logs d'audit immuables (qui a fait quoi, quand, sur quelle ressource).
- Secrets exclusivement en variables d'environnement (`.env`, jamais commit — `.env.example` fourni).
- Upload de fichiers : validation MIME + antivirus scan hook (V2) + URLs signées Supabase Storage à durée limitée.
