import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUserMembership } from "@/lib/auth-guard";
import { getOwnerAction } from "@/modules/owners/actions";
import { OwnerEditForm } from "./edit-form";
import { DocumentsPanel } from "./documents-panel";

export default async function OwnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const membership = await getCurrentUserMembership();
  if (!membership) notFound();

  const owner = await getOwnerAction(id, membership.companyId);
  if (!owner) notFound();

  return (
    <div>
      <Link
        href="/owners"
        className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
      >
        ← Retour aux propriétaires
      </Link>

      <header className="mt-2 mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--color-ink)]">
          {owner.firstName} {owner.lastName}
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <OwnerEditForm
            companyId={membership.companyId}
            owner={{
              id: owner.id,
              firstName: owner.firstName,
              lastName: owner.lastName,
              email: owner.email,
              phone: owner.phone,
              address: owner.address,
              vatRegime: owner.vatRegime,
              paymentMethod: owner.paymentMethod,
              iban: owner.iban,
            }}
          />
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5">
            <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)] mb-3">
              Logements ({owner.properties.length})
            </h2>
            {owner.properties.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-soft)]">Aucun logement rattaché.</p>
            ) : (
              <ul className="space-y-2">
                {owner.properties.map((property) => (
                  <li key={property.id}>
                    <Link
                      href={`/properties/${property.id}`}
                      className="text-sm text-[var(--color-brass-dark)] hover:underline"
                    >
                      {property.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DocumentsPanel
            ownerId={owner.id}
            companyId={membership.companyId}
            documents={owner.documents.map((doc) => ({
              id: doc.id,
              type: doc.type,
              storagePath: doc.storagePath,
              uploadedAt: doc.uploadedAt.toISOString(),
            }))}
          />
        </div>
      </div>
    </div>
  );
}
