import Link from "next/link";
import { listInvoicesAction } from "@/modules/invoicing/actions";
import { getCurrentUserMembership } from "@/lib/auth-guard";
import { GenerateInvoicesButton } from "./generate-button";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-50 text-blue-700",
  PAID: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  OVERDUE: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
  REFUNDED: "bg-slate-100 text-slate-500",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyée",
  PAID: "Payée",
  OVERDUE: "En retard",
  REFUNDED: "Remboursée",
};

export default async function InvoicesPage() {
  const membership = await getCurrentUserMembership();
  const invoices = membership ? await listInvoicesAction(membership.companyId) : [];

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--color-ink)]">
            Factures
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            {invoices.length} facture{invoices.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <GenerateInvoicesButton companyId={membership?.companyId ?? ""} />
      </header>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-paper)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] border-b border-[var(--color-line)]">
            <tr>
              <th className="px-5 py-3.5">Numéro</th>
              <th className="px-5 py-3.5">Propriétaire</th>
              <th className="px-5 py-3.5">Logement</th>
              <th className="px-5 py-3.5">Total TTC</th>
              <th className="px-5 py-3.5">Statut</th>
              <th className="px-5 py-3.5">Échéance</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-ink-soft)]">
                  Aucune facture générée. Importez vos réservations puis lancez la génération mensuelle.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-[var(--color-line)] transition-colors hover:bg-[var(--color-paper)]">
                  <td className="px-5 py-3.5 font-medium">
                    <Link href={`/invoices/${invoice.id}`} className="hover:text-[var(--color-brass-dark)] hover:underline">
                      {invoice.number}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    {invoice.owner.firstName} {invoice.owner.lastName}
                  </td>
                  <td className="px-5 py-3.5">{invoice.property?.name ?? "—"}</td>
                  <td className="px-5 py-3.5">{Number(invoice.totalTTC).toLocaleString("fr-FR")} €</td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[invoice.status]}`}>
                      {STATUS_LABELS[invoice.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--color-ink-soft)]">
                    {invoice.dueDate.toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <a
                      href={`/api/invoices/${invoice.id}/pdf?companyId=${membership?.companyId ?? ""}`}
                      className="text-[var(--color-brass-dark)] hover:underline text-xs"
                      target="_blank"
                    >
                      Voir le PDF
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
