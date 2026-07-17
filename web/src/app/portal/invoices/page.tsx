import { getPortalInvoicesAction, getPortalOwnerAction } from "@/modules/portal/actions";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyée",
  PAID: "Payée",
  OVERDUE: "En retard",
  REFUNDED: "Remboursée",
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-[var(--color-ink)]/5 text-[var(--color-ink-soft)]",
  SENT: "bg-[var(--color-brass)]/10 text-[var(--color-brass-dark)]",
  PAID: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  OVERDUE: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
  REFUNDED: "bg-[var(--color-ink)]/5 text-[var(--color-ink-soft)]",
};

export default async function PortalInvoicesPage() {
  const [invoices, owner] = await Promise.all([getPortalInvoicesAction(), getPortalOwnerAction()]);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-ink)] mb-1">
        Factures &amp; relevés
      </h1>
      <p className="text-sm text-[var(--color-ink-soft)] mb-6">
        Téléchargez vos factures — chacune fait office de relevé pour la période concernée.
      </p>
      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-paper)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] border-b border-[var(--color-line)]">
            <tr>
              <th className="px-5 py-3.5">Numéro</th>
              <th className="px-5 py-3.5">Date</th>
              <th className="px-5 py-3.5">Montant TTC</th>
              <th className="px-5 py-3.5">Statut</th>
              <th className="px-5 py-3.5">PDF</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-ink-soft)]">
                  Aucune facture pour le moment.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-[var(--color-line)]">
                  <td className="px-5 py-3.5 font-medium">{invoice.number}</td>
                  <td className="px-5 py-3.5">{invoice.issueDate.toLocaleDateString("fr-FR")}</td>
                  <td className="px-5 py-3.5">{Number(invoice.totalTTC).toLocaleString("fr-FR")} €</td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[invoice.status] ?? ""}`}>
                      {STATUS_LABELS[invoice.status] ?? invoice.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <a
                      href={`/api/invoices/${invoice.id}/pdf?companyId=${owner?.companyId ?? ""}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--color-brass-dark)] hover:underline"
                    >
                      Télécharger
                    </a>
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
