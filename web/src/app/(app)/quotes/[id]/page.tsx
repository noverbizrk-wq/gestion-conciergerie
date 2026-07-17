import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUserMembership } from "@/lib/auth-guard";
import { getQuotationAction } from "@/modules/quotations/actions";
import { QuotationStatusActions } from "./status-actions";

const STATUS_STYLES: Record<string, string> = {
  PROPOSED: "bg-[var(--color-brass)]/10 text-[var(--color-brass-dark)]",
  EXPIRED: "bg-[var(--color-ink)]/5 text-[var(--color-ink-soft)]",
  REFUSED: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
  ACCEPTED: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  INVOICED: "bg-[var(--color-brass)]/10 text-[var(--color-brass-dark)]",
  ARCHIVED: "bg-[var(--color-ink)]/5 text-[var(--color-ink-soft)]",
};

const STATUS_LABELS: Record<string, string> = {
  PROPOSED: "Proposé",
  EXPIRED: "Expiré",
  REFUSED: "Refusé",
  ACCEPTED: "Accepté",
  INVOICED: "Facturé",
  ARCHIVED: "Archivé",
};

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const membership = await getCurrentUserMembership();
  if (!membership) notFound();

  const quotation = await getQuotationAction(id, membership.companyId);
  if (!quotation) notFound();

  return (
    <div>
      <Link
        href="/quotes"
        className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
      >
        ← Retour aux devis
      </Link>

      <header className="mt-2 mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--color-ink)]">
            Devis {quotation.number}
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            {quotation.owner.firstName} {quotation.owner.lastName}
            {quotation.property ? ` · ${quotation.property.name}` : ""} · valide jusqu&apos;au{" "}
            {quotation.validUntil.toLocaleDateString("fr-FR")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs ${STATUS_STYLES[quotation.status]}`}>
            {STATUS_LABELS[quotation.status]}
          </span>
          <QuotationStatusActions
            quotationId={quotation.id}
            companyId={membership.companyId}
            status={quotation.status}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <InfoBlock label="Prix HT" value={`${Number(quotation.subtotalHT).toLocaleString("fr-FR")} €`} />
        <InfoBlock label="TVA" value={`${Number(quotation.vatAmount).toLocaleString("fr-FR")} €`} />
        <InfoBlock
          label="Montant total TTC"
          value={`${Number(quotation.totalTTC).toLocaleString("fr-FR")} €`}
          highlight
        />
      </div>

      <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--color-line)]">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)]">Lignes du devis</h2>
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
            {quotation.lines.map((line) => (
              <tr key={line.id} className="border-t border-[var(--color-line)] transition-colors hover:bg-[var(--color-paper)]">
                <td className="px-5 py-3.5">{line.description}</td>
                <td className="px-5 py-3.5">{Number(line.quantity)}</td>
                <td className="px-5 py-3.5">{Number(line.vatRate)}%</td>
                <td className="px-5 py-3.5">{Number(line.unitPriceHT).toLocaleString("fr-FR")} €</td>
                <td className="px-5 py-3.5">{Number(line.lineTotalHT).toLocaleString("fr-FR")} €</td>
              </tr>
            ))}
          </tbody>
        </table>
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
