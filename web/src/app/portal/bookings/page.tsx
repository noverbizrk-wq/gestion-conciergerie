import { getPortalBookingsAction } from "@/modules/portal/actions";

export default async function PortalBookingsPage() {
  const bookings = await getPortalBookingsAction();

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-ink)] mb-6">
        Mes réservations
      </h1>
      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-paper)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] border-b border-[var(--color-line)]">
            <tr>
              <th className="px-5 py-3.5">Logement</th>
              <th className="px-5 py-3.5">Arrivée</th>
              <th className="px-5 py-3.5">Départ</th>
              <th className="px-5 py-3.5">Montant brut</th>
              <th className="px-5 py-3.5">Net propriétaire (estimé)</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-ink-soft)]">
                  Aucune réservation pour le moment.
                </td>
              </tr>
            ) : (
              bookings.map((b) => {
                const net = Number(b.netRent) - Number(b.platformCommission) - Number(b.cleaningFee);
                return (
                  <tr key={b.id} className="border-t border-[var(--color-line)]">
                    <td className="px-5 py-3.5 font-medium">{b.property.name}</td>
                    <td className="px-5 py-3.5">{b.checkIn.toLocaleDateString("fr-FR")}</td>
                    <td className="px-5 py-3.5">{b.checkOut.toLocaleDateString("fr-FR")}</td>
                    <td className="px-5 py-3.5">{Number(b.grossAmount).toLocaleString("fr-FR")} €</td>
                    <td className="px-5 py-3.5">{net.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
