# User Flows, API & Backlog — Nover Invoice

## 1. Parcours utilisateurs clés

### Flow A — Onboarding société + premier propriétaire + premier logement
1. Admin crée son compte (Supabase Auth) → crée sa société (SIRET, IBAN, logo, régime TVA par défaut).
2. Admin ajoute un propriétaire (coordonnées, régime TVA propre ou hérité, mode de paiement).
3. Admin ajoute un logement rattaché (type, adresse, mode de commission, éventuel override TVA).
4. Dashboard affiche l'état "0 réservation importée" avec CTA "Importer mes réservations".

### Flow B — Import Airbnb → génération facture
1. Admin va sur "Import" → upload CSV Airbnb.
2. Le système détecte le format, mappe les colonnes (loyer, frais ménage, taxe séjour, commission plateforme), affiche un aperçu de normalisation avant validation.
3. Après validation, les `Booking` sont créés, rattachés au bon logement (matching par nom de logement Airbnb ↔ `Property`, avec résolution manuelle si ambiguë).
4. Sur la fiche logement / mensuelle, l'admin clique "Générer les factures du mois" → le moteur calcule la commission sur le loyer net, résout la TVA (logement > propriétaire > société), crée les factures en `DRAFT`.
5. Admin relit, valide → statut `SENT`, PDF généré et éventuellement envoyé par email.

### Flow C — Ménage facturé au propriétaire
1. Une tâche de ménage est créée (manuellement ou déclenchée par un checkout Airbnb importé).
2. L'employé (ou l'admin) complète date, durée, photos avant/après, signature.
3. En fin de mois, la tâche est incluse dans la facture mensuelle du propriétaire comme ligne distincte (TVA résolue indépendamment si le taux diffère).

### Flow D — Suivi paiement et relance (V2)
1. Facture `SENT` non payée à échéance → passe `OVERDUE`.
2. Relances automatiques envoyées à J+3/J+7/J+15/J+30 (email, puis SMS/WhatsApp en option).
3. Paiement reçu (manuel, Stripe ou GoCardless) → statut `PAID`, `Payment` créé, dashboard mis à jour.

---

## 2. API / Server Actions (MVP)

Toutes les actions sont des **Next.js Server Actions** typées (pas de REST public exposé en V1, sauf webhooks Stripe/Resend). Convention : `modules/<domaine>/actions.ts`.

| Action | Rôles autorisés | Description |
|---|---|---|
| `createOwner(input)` | ADMIN, ACCOUNTANT | Crée un propriétaire |
| `updateOwner(id, input)` | ADMIN, ACCOUNTANT | Met à jour |
| `listOwners(filters)` | tous | Liste paginée |
| `createProperty(input)` | ADMIN, ACCOUNTANT | Crée un logement |
| `updateProperty(id, input)` | ADMIN, ACCOUNTANT | Met à jour (commission, TVA override) |
| `importBookingsCsv(file, source)` | ADMIN, ACCOUNTANT | Parse + normalise + preview |
| `confirmBookingsImport(previewId, mapping)` | ADMIN, ACCOUNTANT | Persiste les `Booking` |
| `generateMonthlyInvoices(month, companyId)` | ADMIN, ACCOUNTANT | Génère toutes les factures du mois |
| `generateInvoice(ownerId, propertyId?, month)` | ADMIN, ACCOUNTANT | Génère une facture unique |
| `getInvoicePdf(invoiceId)` | tous (RLS) | Retourne l'URL signée du PDF |
| `markInvoicePaid(invoiceId, payment)` | ADMIN, ACCOUNTANT | Enregistre un paiement manuel |
| `getDashboardMetrics(companyId, period)` | tous | Agrégats CA/TVA/factures |
| `createCleaningTask(input)` | ADMIN, EMPLOYEE | Crée une tâche de ménage |
| `completeCleaningTask(id, photos, signature)` | EMPLOYEE | Complète la tâche |

Webhooks exposés (routes API classiques, hors Server Actions) :
- `POST /api/webhooks/stripe`
- `POST /api/webhooks/gocardless` (V2)
- `POST /api/webhooks/resend` (V2, tracking d'ouverture des relances)

---

## 3. Backlog priorisé

### MVP (V1) — objectif : facturer réellement un mois d'activité de bout en bout
1. Auth + multi-société + RBAC de base
2. CRUD Propriétaires (+ documents)
3. CRUD Logements (+ commission + override TVA)
4. Import CSV Airbnb avec preview de mapping
5. Moteur de résolution TVA mixte (logement > propriétaire > société)
6. Moteur de facturation commission (loyer net) + ménage
7. Génération PDF facture (branding, IBAN, QR virement)
8. Suivi paiement manuel (payée/en attente/retard)
9. Dashboard (CA, TVA collectée, factures payées/en attente, compteurs logements/propriétaires)
10. Facturation en masse (1 clic pour tout le mois)

### V2 — objectif : réduire le travail manuel et professionnaliser le recouvrement
11. Adaptateurs import Booking/Smoobu/Hostaway/Guesty
12. Relances automatiques (email J+3/7/15/30)
13. Paiement en ligne Stripe + GoCardless
14. Exports comptables (Excel/CSV, formats Sage/Pennylane/Indy/Cegid/Quadra)
15. Gestion des équipes de ménage (planning, affectation employé)
16. Assistant IA (Q&A, détection d'anomalies, rapport mensuel, estimation trésorerie)
17. Notifications (nouvelle réservation, facture impayée, ménage à faire, paiement reçu)

### V3 — objectif : conformité réforme facture électronique + robustesse
18. Factur-X (PDF/A-3 + XML CII) + UBL + PEPPOL
19. Connexion PDP (Plateforme de Dématérialisation Partenaire)
20. Signature électronique des factures/contrats
21. Archivage légal probant (coffre-fort numérique, empreinte + horodatage)
22. Rapprochement bancaire automatique
23. OCR factures fournisseurs
24. PWA, mode sombre, multilingue

---

## 4. Maquettes des écrans principaux

Les maquettes interactives (Dashboard, Fiche logement, Génération de facture, Import CSV) sont fournies séparément sous forme de visuels dans la conversation, plutôt que dans ce document texte, pour rester consultables rapidement.
