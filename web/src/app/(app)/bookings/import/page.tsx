import Link from "next/link";
import { getCurrentUserMembership } from "@/lib/auth-guard";
import { listPropertiesAction } from "@/modules/properties/actions";
import { ImportForm } from "./import-form";

export default async function ImportBookingsPage() {
  const membership = await getCurrentUserMembership();
  if (!membership) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--color-line)] p-8 text-sm text-[var(--color-ink-soft)]">
        Votre compte n&apos;est rattaché à aucune société pour le moment.
      </div>
    );
  }

  const properties = await listPropertiesAction(membership.companyId);

  return (
    <div>
      <Link
        href="/bookings"
        className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
      >
        ← Retour aux réservations
      </Link>

      <header className="mt-2 mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-ink)]">
          Importer des réservations
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-1">
          Importe un export CSV Airbnb — les logements sont rapprochés automatiquement, à valider avant confirmation.
        </p>
      </header>

      {properties.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-soft)]">
          Ajoutez d&apos;abord au moins un logement avant d&apos;importer des réservations.
        </p>
      ) : (
        <ImportForm
          companyId={membership.companyId}
          properties={properties.map((p) => ({ id: p.id, name: p.name }))}
        />
      )}
    </div>
  );
}
