import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUserMembership } from "@/lib/auth-guard";
import { getInvoiceAction } from "@/modules/invoicing/actions";
import { ValidateInvoiceButton } from "./validate-button";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-[var(--color-ink)]/5 text-[var(--color-ink-soft)]",
  SENT: "bg-[var(--color-brass)]/10 text-[var(--color-brass-dark)]",
  PAID: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  OVERDUE: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
  REFUNDED: "bg-[var(--color-ink)]/5 text-[var(--color-ink-soft)]",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyée / validée",
  PAID: "Payée",
  OVERDUE: "En retard",
  REFUNDED: "Remboursée",
};

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const membership = await getCurrentUserMembership();
  if (!membership) notFound();

  const invoice = await getInvoiceAction(id, membership.companyId);
  if (!invoice) notFound();

  return (
    <div>
      <Link
        href="/invoices"
        className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
      >
        ← Retour aux factures
      </Link>

      <header className="mt-2 mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--color-ink)]">
            Facture {invoice.number}
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            {invoice.owner.firstName} {invoice.owner.lastName}
            {invoice.property ? ` · ${invoice.property.name}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs ${STATUS_STYLES[invoice.status]}`}>
            {STATUS_LABELS[invoice.status]}
          </span>
          {invoice.status === "DRAFT" ? (
            <ValidateInvoiceButton invoiceId={invoice.id} companyId={membership.companyId} />
          ) : null}
          <a
            href={`/api/invoices/${invoice.id}/pdf?companyId=${membership.companyId}`}
            target="_blank"
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-raised)] text-sm font-medium px-4 py-2 shadow-sm hover:border-[var(--color-brass)] hover:text-[var(--color-brass-dark)] transition-all"
          >
            Voir le PDF
          </a>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <InfoBlock label="Prix HT" value={`${Number(invoice.subtotalHT).toLocaleString("fr-FR")} €`} />
        <InfoBlock label="TVA" value={`${Number(invoice.vatAmount).toLocaleString("fr-FR")} €`} />
        <InfoBlock
          label="Montant total TTC"
          value={`${Number(invoice.totalTTC).toLocaleString("fr-FR")} €`}
          highlight
        />
      </div>

      <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-[var(--color-line)]">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)]">
            Prestations référencées
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-paper)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] border-b border-[var(--color-line)]">
            <tr>
              <th className="px-5 py-3.5">Désignation</th>
              <th className="px-5 py-3.5">Quantité</th>
              <th className="px-5 py-3.5">TVA</th>
              <th className="px-5 py-3.5">Prix unit. HT</th>
              <th className="px-5 py-3.5">Montant HT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[var(--color-ink-soft)]">
                  Aucune ligne sur cette facture.
                </td>
              </tr>
            ) : (
              invoice.lines.map((line) => (
                <tr key={line.id} className="border-t border-[var(--color-line)] transition-colors hover:bg-[var(--color-paper)]">
                  <td className="px-5 py-3.5">{line.description}</td>
                  <td className="px-5 py-3.5">{Number(line.quantity)}</td>
                  <td className="px-5 py-3.5">{Number(line.vatRate)}%</td>
                  <td className="px-5 py-3.5">{Number(line.unitPriceHT).toLocaleString("fr-FR")} €</td>
                  <td className="px-5 py-3.5">{Number(line.lineTotalHT).toLocaleString("fr-FR")} €</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--color-line)]">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)]">Paiements</h2>
        </div>
        {invoice.payments.length === 0 ? (
          <p className="px-5 py-6 text-sm text-[var(--color-ink-soft)]">
            Aucun paiement enregistré pour cette facture.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-paper)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] border-b border-[var(--color-line)]">
              <tr>
                <th className="px-5 py-3.5">Montant</th>
                <th className="px-5 py-3.5">Méthode</th>
                <th className="px-5 py-3.5">Payé le</th>
                <th className="px-5 py-3.5">Statut</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((payment) => (
                <tr key={payment.id} className="border-t border-[var(--color-line)] transition-colors hover:bg-[var(--color-paper)]">
                  <td className="px-5 py-3.5">{Number(payment.amount).toLocaleString("fr-FR")} €</td>
                  <td className="px-5 py-3.5">{payment.method}</td>
                  <td className="px-5 py-3.5">
                    {payment.paidAt ? payment.paidAt.toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="px-5 py-3.5">{payment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function InfoBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm px-5 py-4">
      <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">{label}</p>
      <p
        className={`mt-2 font-[family-name:var(--font-display)] text-2xl ${
          highlight ? "text-[var(--color-brass-dark)]" : "text-[var(--color-ink)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
