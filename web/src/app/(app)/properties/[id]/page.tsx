import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUserMembership } from "@/lib/auth-guard";
import { getPropertyAction } from "@/modules/properties/actions";
import { PropertyEditForm } from "./edit-form";

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const membership = await getCurrentUserMembership();
  if (!membership) notFound();

  const property = await getPropertyAction(id, membership.companyId);
  if (!property) notFound();

  return (
    <div>
      <Link
        href="/properties"
        className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
      >
        ← Retour aux logements
      </Link>

      <header className="mt-2 mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-ink)]">{property.name}</h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-1">
          Propriétaire :{" "}
          <Link href={`/owners/${property.owner.id}`} className="text-[var(--color-brass-dark)] hover:underline">
            {property.owner.firstName} {property.owner.lastName}
          </Link>
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <PropertyEditForm
            companyId={membership.companyId}
            property={{
              id: property.id,
              name: property.name,
              address: property.address,
              city: property.city,
              postalCode: property.postalCode,
              type: property.type,
              commissionRate: property.commissionRate ? Number(property.commissionRate) : null,
              cleaningBilledTo: property.cleaningBilledTo,
              cleaningFlatRate: property.cleaningFlatRate ? Number(property.cleaningFlatRate) : null,
            }}
          />
        </div>

        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)] mb-3">
            Dernières réservations
          </h2>
          {property.bookings.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-soft)]">Aucune réservation pour ce logement.</p>
          ) : (
            <ul className="space-y-2">
              {property.bookings.map((booking) => (
                <li key={booking.id}>
                  <Link
                    href={`/bookings/${booking.id}`}
                    className="text-sm text-[var(--color-brass-dark)] hover:underline"
                  >
                    {booking.checkIn.toLocaleDateString("fr-FR")} → {booking.checkOut.toLocaleDateString("fr-FR")}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
