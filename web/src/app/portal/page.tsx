import Link from "next/link";
import { getPortalOwnerAction, getPortalPropertiesAction, getPortalBookingsAction, getPortalInvoicesAction } from "@/modules/portal/actions";

export default async function PortalHomePage() {
  const [owner, properties, bookings, invoices] = await Promise.all([
    getPortalOwnerAction(),
    getPortalPropertiesAction(),
    getPortalBookingsAction(),
    getPortalInvoicesAction(),
  ]);

  const upcoming = bookings.filter((b) => b.checkIn >= new Date()).slice(0, 5);
  const unpaidInvoices = invoices.filter((i) => i.status === "SENT" || i.status === "OVERDUE");
  const totalRevenueTTC = invoices.reduce((sum, i) => sum + Number(i.totalTTC), 0);

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-ink)]">
          Bonjour {owner?.firstName}
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-1">
          Vue d&apos;ensemble de vos {properties.length} logement{properties.length > 1 ? "s" : ""}.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5">
          <p className="text-[11px] uppercase tracking-wide text-[var(--color-ink-soft)]">Logements</p>
          <p className="mt-2 text-2xl font-[family-name:var(--font-display)]">{properties.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5">
          <p className="text-[11px] uppercase tracking-wide text-[var(--color-ink-soft)]">Factures en attente</p>
          <p className="mt-2 text-2xl font-[family-name:var(--font-display)] text-[var(--color-warning)]">
            {unpaidInvoices.length}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5">
          <p className="text-[11px] uppercase tracking-wide text-[var(--color-ink-soft)]">Total facturé TTC</p>
          <p className="mt-2 text-2xl font-[family-name:var(--font-display)]">
            {totalRevenueTTC.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)] mb-3">
          Prochaines réservations
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-soft)]">Aucune réservation à venir.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((b) => (
              <li key={b.id} className="flex items-center justify-between text-sm">
                <span>{b.property.name}</span>
                <span className="text-[var(--color-ink-soft)]">
                  {b.checkIn.toLocaleDateString("fr-FR")} → {b.checkOut.toLocaleDateString("fr-FR")}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/portal/bookings" className="inline-block mt-4 text-xs text-[var(--color-brass-dark)] hover:underline">
          Voir toutes mes réservations →
        </Link>
      </section>
    </div>
  );
}
