import Link from "next/link";
import { getCurrentUserMembership } from "@/lib/auth-guard";
import { listQuotationsAction } from "@/modules/quotations/actions";

const STATUS_STYLES: Record<string, string> = {
  PROPOSED: "bg-blue-50 text-blue-700",
  EXPIRED: "bg-slate-100 text-slate-500",
  REFUSED: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
  ACCEPTED: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  INVOICED: "bg-[var(--color-brass)]/10 text-[var(--color-brass-dark)]",
  ARCHIVED: "bg-slate-100 text-slate-400",
};

const STATUS_LABELS: Record<string, string> = {
  PROPOSED: "Proposé",
  EXPIRED: "Expiré",
  REFUSED: "Refusé",
  ACCEPTED: "Accepté",
  INVOICED: "Facturé",
  ARCHIVED: "Archivé",
};

export default async function QuotesPage() {
  const membership = await getCurrentUserMembership();
  const quotations = membership ? await listQuotationsAction(membership.companyId) : [];

  const counts = quotations.reduce<Record<string, number>>((acc, q) => {
    acc[q.status] = (acc[q.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--color-ink)]">Devis</h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            {quotations.length} devis au total
          </p>
        </div>
        <Link
          href="/quotes/new"
          className="rounded-lg bg-[var(--color-brass)] text-white text-sm font-medium px-4 py-2 shadow-sm hover:bg-[var(--color-brass-dark)] transition-all active:scale-[0.98]"
        >
          Nouveau devis
        </Link>
      </header>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {(["PROPOSED", "EXPIRED", "REFUSED", "ACCEPTED", "INVOICED", "ARCHIVED"] as const).map((status) => (
          <div
            key={status}
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm px-3 py-3 text-center"
          >
            <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-ink)]">
              {counts[status] ?? 0}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-soft)] mt-1">
              {STATUS_LABELS[status]}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-paper)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] border-b border-[var(--color-line)]">
            <tr>
              <th className="px-5 py-3.5">Numéro</th>
              <th className="px-5 py-3.5">Client</th>
              <th className="px-5 py-3.5">Valide jusqu&apos;au</th>
              <th className="px-5 py-3.5">Montant TTC</th>
              <th className="px-5 py-3.5">Statut</th>
            </tr>
          </thead>
          <tbody>
            {quotations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-ink-soft)]">
                  Aucun devis pour le moment.
                </td>
              </tr>
            ) : (
              quotations.map((q) => (
                <tr key={q.id} className="border-t border-[var(--color-line)] transition-colors hover:bg-[var(--color-paper)]">
                  <td className="px-5 py-3.5 font-medium">
                    <Link href={`/quotes/${q.id}`} className="hover:text-[var(--color-brass-dark)] hover:underline">
                      {q.number}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    {q.owner.firstName} {q.owner.lastName}
                  </td>
                  <td className="px-5 py-3.5">{q.validUntil.toLocaleDateString("fr-FR")}</td>
                  <td className="px-5 py-3.5">{Number(q.totalTTC).toLocaleString("fr-FR")} €</td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[q.status]}`}>
                      {STATUS_LABELS[q.status]}
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
