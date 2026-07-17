import { getCurrentUserMembership } from "@/lib/auth-guard";
import { getPaymentsAction } from "@/modules/payments/actions";
import { KpiCard } from "@/components/kpi-card";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  CONFIRMED: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  FAILED: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  FAILED: "Échoué",
};

export default async function PaymentsPage() {
  const membership = await getCurrentUserMembership();
  if (!membership) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--color-line)] p-8 text-sm text-[var(--color-ink-soft)]">
        Votre compte n&apos;est rattaché à aucune société pour le moment.
      </div>
    );
  }

  const { payments, kpis } = await getPaymentsAction(membership.companyId);

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-ink)]">
          Encaissements
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-1">
          Suivi des paiements reçus sur les factures.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Encaissements confirmés" value={`${kpis.totalBrut.toLocaleString("fr-FR")} €`} tone="success" />
        <KpiCard label="Transactions confirmées" value={String(kpis.transactionsConfirmees)} tone="success" />
        <KpiCard label="Transactions en attente" value={String(kpis.transactionsEnAttente)} tone="warning" />
        <KpiCard label="Transactions échouées" value={String(kpis.transactionsEchouees)} tone="danger" />
      </section>

      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-raised)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-paper)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Facture</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Méthode</th>
              <th className="px-4 py-3">Payé le</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-ink-soft)]">
                  Aucun encaissement enregistré pour le moment.
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="border-t border-[var(--color-line)]">
                  <td className="px-4 py-3">
                    {payment.invoice.owner.firstName} {payment.invoice.owner.lastName}
                  </td>
                  <td className="px-4 py-3">{payment.invoice.number}</td>
                  <td className="px-4 py-3">{Number(payment.amount).toLocaleString("fr-FR")} €</td>
                  <td className="px-4 py-3">{payment.method}</td>
                  <td className="px-4 py-3">
                    {payment.paidAt ? payment.paidAt.toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[payment.status]}`}>
                      {STATUS_LABELS[payment.status]}
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
