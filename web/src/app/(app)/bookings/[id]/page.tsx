import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUserMembership } from "@/lib/auth-guard";
import { getBookingAction } from "@/modules/bookings-import/actions";
import { BookingStatusForm } from "./status-form";

const STATUS_STYLES: Record<string, string> = {
  IMPORTED: "bg-blue-50 text-blue-700",
  INVOICED: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  IGNORED: "bg-slate-100 text-slate-500",
};

const STATUS_LABELS: Record<string, string> = {
  IMPORTED: "Importée",
  INVOICED: "Facturée",
  IGNORED: "Ignorée",
};

const ACTION_LABELS: Record<string, string> = {
  BOOKING_STATUS_CHANGED: "Statut modifié",
  BOOKINGS_IMPORTED: "Import en lot",
};

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const membership = await getCurrentUserMembership();
  if (!membership) notFound();

  const result = await getBookingAction(id, membership.companyId);
  if (!result) notFound();

  const { booking, activity } = result;

  return (
    <div>
      <Link
        href="/bookings"
        className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
      >
        ← Retour aux réservations
      </Link>

      <header className="mt-2 mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--color-ink)]">
            {booking.property.name}
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            Propriétaire : {booking.property.owner.firstName} {booking.property.owner.lastName} · Source :{" "}
            {booking.source} ({booking.externalId})
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs ${STATUS_STYLES[booking.status]}`}>
          {STATUS_LABELS[booking.status]}
        </span>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5">
            <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)] mb-4">
              Détails du séjour
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-[var(--color-ink-soft)]">Arrivée</dt>
                <dd>{booking.checkIn.toLocaleDateString("fr-FR")}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-ink-soft)]">Départ</dt>
                <dd>{booking.checkOut.toLocaleDateString("fr-FR")}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-ink-soft)]">Montant brut</dt>
                <dd>{Number(booking.grossAmount).toLocaleString("fr-FR")} €</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-ink-soft)]">Loyer net</dt>
                <dd>{Number(booking.netRent).toLocaleString("fr-FR")} €</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-ink-soft)]">Frais de ménage</dt>
                <dd>{Number(booking.cleaningFee).toLocaleString("fr-FR")} €</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-ink-soft)]">Taxe de séjour</dt>
                <dd>{Number(booking.touristTax).toLocaleString("fr-FR")} €</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-ink-soft)]">Commission plateforme</dt>
                <dd>{Number(booking.platformCommission).toLocaleString("fr-FR")} €</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5">
            <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)] mb-4">
              Journal d&apos;activité
            </h2>
            {activity.length === 0 ? (
              <div className="text-sm">
                <p className="text-[var(--color-ink-soft)]">
                  Aucune activité enregistrée depuis l&apos;import.
                </p>
                <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
                  Importée le {booking.createdAt.toLocaleDateString("fr-FR")}
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {activity.map((entry) => (
                  <li key={entry.id} className="flex gap-3 text-sm">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-[var(--color-paper)] flex items-center justify-center text-xs font-medium text-[var(--color-ink-soft)]">
                      {(entry.user?.name ?? entry.user?.email ?? "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--color-ink)]">
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </p>
                      <p className="text-xs text-[var(--color-ink-soft)]">
                        {entry.createdAt.toLocaleString("fr-FR")} · {entry.user?.name ?? entry.user?.email ?? "Système"}
                      </p>
                      {entry.diff ? (
                        <pre className="mt-1 text-xs text-[var(--color-ink-soft)] whitespace-pre-wrap">
                          {JSON.stringify(entry.diff)}
                        </pre>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div>
          <BookingStatusForm
            bookingId={booking.id}
            companyId={membership.companyId}
            currentStatus={booking.status}
          />
        </div>
      </div>
    </div>
  );
}
