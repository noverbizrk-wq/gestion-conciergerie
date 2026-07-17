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
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--color-ink)]">
            Réservations
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            {bookings.length} réservation{bookings.length > 1 ? "s" : ""} importée{bookings.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/bookings/import"
          className="rounded-lg bg-[var(--color-brass)] text-white text-sm font-medium px-4 py-2 shadow-sm hover:bg-[var(--color-brass-dark)] transition-all active:scale-[0.98]"
        >
          Importer un CSV
        </Link>
      </header>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-paper)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] border-b border-[var(--color-line)]">
            <tr>
              <th className="px-5 py-3.5">Logement</th>
              <th className="px-5 py-3.5">Source</th>
              <th className="px-5 py-3.5">Arrivée</th>
              <th className="px-5 py-3.5">Départ</th>
              <th className="px-5 py-3.5">Montant brut</th>
              <th className="px-5 py-3.5">Statut</th>
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
                <tr key={booking.id} className="border-t border-[var(--color-line)] transition-colors hover:bg-[var(--color-paper)]">
                  <td className="px-5 py-3.5 font-medium">
                    <Link href={`/bookings/${booking.id}`} className="hover:text-[var(--color-brass-dark)] hover:underline">
                      {booking.property.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">{booking.source}</td>
                  <td className="px-5 py-3.5">{booking.checkIn.toLocaleDateString("fr-FR")}</td>
                  <td className="px-5 py-3.5">{booking.checkOut.toLocaleDateString("fr-FR")}</td>
                  <td className="px-5 py-3.5">{Number(booking.grossAmount).toLocaleString("fr-FR")} €</td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[booking.status]}`}>
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
