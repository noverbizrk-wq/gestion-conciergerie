import Link from "next/link";
import { listBookingsAction } from "@/modules/bookings-import/actions";
import { getCurrentUserMembership } from "@/lib/auth-guard";

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

export default async function BookingsPage() {
  const membership = await getCurrentUserMembership();
  const bookings = membership ? await listBookingsAction(membership.companyId) : [];

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-ink)]">
          Réservations
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-1">
          {bookings.length} réservation{bookings.length > 1 ? "s" : ""} importée{bookings.length > 1 ? "s" : ""}
        </p>
      </header>

      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-raised)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-paper)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            <tr>
              <th className="px-4 py-3">Logement</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Arrivée</th>
              <th className="px-4 py-3">Départ</th>
              <th className="px-4 py-3">Montant brut</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-ink-soft)]">
                  Aucune réservation importée pour le moment.
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id} className="border-t border-[var(--color-line)]">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/bookings/${booking.id}`} className="hover:text-[var(--color-brass-dark)] hover:underline">
                      {booking.property.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{booking.source}</td>
                  <td className="px-4 py-3">{booking.checkIn.toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3">{booking.checkOut.toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3">{Number(booking.grossAmount).toLocaleString("fr-FR")} €</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[booking.status]}`}>
                      {STATUS_LABELS[booking.status]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
