# Modèle de données — Nover Invoice

## 1. Entités principales (vue relationnelle)

```
Company 1───* Membership *───1 User
Company 1───* Owner
Company 1───* Property
Owner   1───* Property
Property 1───* Booking
Property 1───* CleaningTask
Booking  1───1 CommissionInvoiceLine (0..1)
Owner    1───* Invoice
Invoice  1───* InvoiceLine
Invoice  1───* Payment
Property 1───* VatSetting (override)
Owner    1───1 VatSetting (défaut propriétaire)
Company  1───1 VatSetting (défaut société)
Company  1───* AuditLog
```

## 2. Détail des tables clés

### Company (multi-société)
- id, name, siret, tva_intracom, address, iban, logoUrl, brandColor, defaultVatRate, defaultVatRegime (`REEL` | `FRANCHISE`), createdAt

### User / Membership
- User: id, email, name, supabaseAuthId
- Membership: userId, companyId, role (`ADMIN` | `ACCOUNTANT` | `EMPLOYEE` | `READONLY`)

### Owner (propriétaire)
- id, companyId, firstName, lastName, companyName?, siret?, address, phone, email
- vatRegime (`REEL` | `FRANCHISE` | `INHERIT_COMPANY`)
- vatRate (nullable, utilisé si `REEL`)
- paymentMethod (`VIREMENT` | `CB` | `ESPECES` | `STRIPE` | `GOCARDLESS`)
- iban, notes
- documents: Document[] (contrat, RIB, pièce d'identité)

### Property (logement)
- id, companyId, ownerId, name, address, city, postalCode, photos[]
- type (`STUDIO` | `T2` | `T3` | `T4_PLUS` | `MAISON` | `APPARTEMENT`)
- commissionMode (`FIXED_PERCENT` | `VARIABLE_TIERS`)
- commissionRate (utilisé si `FIXED_PERCENT`)
- commissionTiers (JSONB, utilisé si `VARIABLE_TIERS`, ex: paliers de CA)
- vatRateOverride (nullable — priorité la plus haute dans la résolution TVA)
- cleaningBilledTo (`OWNER` | `GUEST`)
- cleaningFlatRate (nullable)

### Booking (réservation importée)
- id, companyId, propertyId, source (`AIRBNB` | `BOOKING` | `SMOOBU` | `HOSTAWAY` | `GUESTY`)
- externalId, checkIn, checkOut
- grossAmount (montant brut voyageur affiché sur la plateforme)
- netRent (**loyer net — base commissionnable retenue**)
- cleaningFee, touristTax, platformCommission
- rawImportPayload (JSONB, pour audit/re-traitement)
- status (`IMPORTED` | `INVOICED` | `IGNORED`)

### Invoice (facture)
- id, companyId, ownerId, propertyId?, type (`COMMISSION` | `CLEANING` | `MIXED`)
- number (séquence légale par société), issueDate, dueDate
- status (`DRAFT` | `SENT` | `PAID` | `OVERDUE` | `REFUNDED`)
- subtotalHT, vatAmount, totalTTC
- pdfUrl, facturXXml (V3)
- InvoiceLine[]: description, quantity, unitPriceHT, vatRate, lineTotalHT, sourceBookingId?

### CleaningTask (ménage)
- id, companyId, propertyId, employeeId, date, durationMinutes, price
- billedTo (`OWNER` | `GUEST`)
- photosBefore[], photosAfter[], comments, signatureUrl
- invoiceLineId (nullable une fois facturé)

### Payment
- id, invoiceId, amount, method, paidAt, status (`PENDING` | `CONFIRMED` | `FAILED`)
- stripePaymentIntentId?, gocardlessPaymentId?

### VatSetting (moteur de résolution TVA mixte)
Table dédiée + logique applicative, pour audit clair de la résolution :
- scope (`COMPANY` | `OWNER` | `PROPERTY`), scopeId, regime (`REEL` | `FRANCHISE`), rate (nullable)

**Algorithme de résolution du taux de TVA appliqué à une ligne de facture :**
1. Si `Property.vatRateOverride` défini → l'utiliser.
2. Sinon si `Owner.vatRegime` = `FRANCHISE` → 0 % (mention légale d'exonération).
3. Sinon si `Owner.vatRegime` = `REEL` avec `Owner.vatRate` défini → l'utiliser.
4. Sinon → `Company.defaultVatRate` / `Company.defaultVatRegime`.

Chaque ligne de facture stocke le taux **résolu** (`vatRate`) et l'origine de la résolution (`vatRateSource`) pour traçabilité en cas de contrôle.

### AuditLog
- id, companyId, userId, action, entityType, entityId, diff (JSONB), createdAt

### Document
- id, ownerId (ou propertyId), type (`CONTRAT` | `RIB` | `PIECE_IDENTITE` | `AUTRE`), storagePath, uploadedAt

---

## 3. Schéma Prisma (extrait — voir `prisma/schema.prisma` dans le code livré pour la version complète)

```prisma
model Company {
  id               String   @id @default(cuid())
  name             String
  siret            String?
  tvaIntracom      String?
  address          String?
  iban             String?
  logoUrl          String?
  brandColor       String?  @default("#0F172A")
  defaultVatRate   Decimal  @default(20)
  defaultVatRegime VatRegime @default(REEL)
  createdAt        DateTime @default(now())

  memberships Membership[]
  owners      Owner[]
  properties  Property[]
  invoices    Invoice[]
  auditLogs   AuditLog[]
}

enum VatRegime {
  REEL
  FRANCHISE
  INHERIT_COMPANY
}

model Owner {
  id          String   @id @default(cuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  firstName   String
  lastName    String
  companyName String?
  siret       String?
  address     String?
  phone       String?
  email       String?
  vatRegime   VatRegime @default(INHERIT_COMPANY)
  vatRate     Decimal?
  paymentMethod PaymentMethod @default(VIREMENT)
  iban        String?
  notes       String?
  properties  Property[]
  invoices    Invoice[]
  documents   Document[]
  createdAt   DateTime @default(now())
}

model Property {
  id                String   @id @default(cuid())
  companyId         String
  ownerId           String
  owner             Owner    @relation(fields: [ownerId], references: [id])
  name              String
  address           String
  city              String
  postalCode        String
  photos            String[]
  type              PropertyType
  commissionMode    CommissionMode @default(FIXED_PERCENT)
  commissionRate    Decimal?
  commissionTiers   Json?
  vatRateOverride   Decimal?
  cleaningBilledTo  BilledTo  @default(OWNER)
  cleaningFlatRate  Decimal?
  bookings          Booking[]
  cleaningTasks     CleaningTask[]
  createdAt         DateTime @default(now())
}

model Booking {
  id                  String   @id @default(cuid())
  companyId           String
  propertyId          String
  property            Property @relation(fields: [propertyId], references: [id])
  source              BookingSource
  externalId          String
  checkIn             DateTime
  checkOut            DateTime
  grossAmount         Decimal
  netRent             Decimal
  cleaningFee         Decimal  @default(0)
  touristTax          Decimal  @default(0)
  platformCommission  Decimal  @default(0)
  rawImportPayload    Json?
  status              BookingStatus @default(IMPORTED)
  createdAt           DateTime @default(now())

  @@unique([propertyId, source, externalId])
}

model Invoice {
  id           String   @id @default(cuid())
  companyId    String
  ownerId      String
  owner        Owner    @relation(fields: [ownerId], references: [id])
  propertyId   String?
  type         InvoiceType
  number       String
  issueDate    DateTime @default(now())
  dueDate      DateTime
  status       InvoiceStatus @default(DRAFT)
  subtotalHT   Decimal
  vatAmount    Decimal
  totalTTC     Decimal
  pdfUrl       String?
  lines        InvoiceLine[]
  payments     Payment[]
  createdAt    DateTime @default(now())

  @@unique([companyId, number])
}

model InvoiceLine {
  id             String   @id @default(cuid())
  invoiceId      String
  invoice        Invoice  @relation(fields: [invoiceId], references: [id])
  description    String
  quantity       Decimal  @default(1)
  unitPriceHT    Decimal
  vatRate        Decimal
  vatRateSource  String
  lineTotalHT    Decimal
  sourceBookingId String?
}
```

*(le fichier complet, incluant `CleaningTask`, `Payment`, `Document`, `Membership`, `AuditLog`, `User` et tous les enums, est livré dans `prisma/schema.prisma`)*
