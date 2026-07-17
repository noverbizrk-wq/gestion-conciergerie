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
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-ink)]">
            Factures
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            {invoices.length} facture{invoices.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <GenerateInvoicesButton companyId={membership?.companyId ?? ""} />
      </header>

      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-raised)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-paper)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            <tr>
              <th className="px-4 py-3">Numéro</th>
              <th className="px-4 py-3">Propriétaire</th>
              <th className="px-4 py-3">Logement</th>
              <th className="px-4 py-3">Total TTC</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Échéance</th>
              <th className="px-4 py-3" />
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
                <tr key={invoice.id} className="border-t border-[var(--color-line)]">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/invoices/${invoice.id}`} className="hover:text-[var(--color-brass-dark)] hover:underline">
                      {invoice.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {invoice.owner.firstName} {invoice.owner.lastName}
                  </td>
                  <td className="px-4 py-3">{invoice.property?.name ?? "—"}</td>
                  <td className="px-4 py-3">{Number(invoice.totalTTC).toLocaleString("fr-FR")} €</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[invoice.status]}`}>
                      {STATUS_LABELS[invoice.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">
                    {invoice.dueDate.toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-right">
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
