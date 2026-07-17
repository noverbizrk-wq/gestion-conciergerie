import Link from "next/link";
import { getCurrentUserMembership } from "@/lib/auth-guard";
import { listOwnersAction } from "@/modules/owners/actions";
import { listPropertiesAction } from "@/modules/properties/actions";
import { QuoteForm } from "./quote-form";

export default async function NewQuotePage() {
  const membership = await getCurrentUserMembership();
  if (!membership) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--color-line)] p-8 text-sm text-[var(--color-ink-soft)]">
        Votre compte n&apos;est rattaché à aucune société pour le moment.
      </div>
    );
  }

  const [owners, properties] = await Promise.all([
    listOwnersAction(membership.companyId),
    listPropertiesAction(membership.companyId),
  ]);

  return (
    <div>
      <Link
        href="/quotes"
        className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
      >
        ← Retour aux devis
      </Link>

      <header className="mt-2 mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--color-ink)]">Nouveau devis</h1>
      </header>

      {owners.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-soft)]">
          Ajoutez d&apos;abord un propriétaire avant de créer un devis.
        </p>
      ) : (
        <QuoteForm
          companyId={membership.companyId}
          owners={owners.map((o) => ({ id: o.id, firstName: o.firstName, lastName: o.lastName }))}
          properties={properties.map((p) => ({ id: p.id, name: p.name, ownerId: p.ownerId }))}
        />
      )}
    </div>
  );
}
