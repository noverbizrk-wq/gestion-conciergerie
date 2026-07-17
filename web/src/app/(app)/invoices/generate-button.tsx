"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateAllMonthlyInvoicesAction } from "@/modules/invoicing/actions";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export function GenerateInvoicesButton({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-[var(--color-brass)] text-white text-sm px-4 py-2 hover:bg-[var(--color-brass-dark)] transition-colors"
      >
        Générer les factures du mois
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-4 flex items-center gap-3">
      <select
        value={month}
        onChange={(e) => setMonth(Number(e.target.value))}
        className="rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
      >
        {MONTHS.map((label, i) => (
          <option key={i} value={i + 1}>
            {label}
          </option>
        ))}
      </select>
      <input
        type="number"
        value={year}
        onChange={(e) => setYear(Number(e.target.value))}
        className="w-24 rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
      />
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          setResult(null);
          startTransition(async () => {
            try {
              const results = await generateAllMonthlyInvoicesAction(companyId, year, month);
              const created = results.filter((r) => !r.skipped).length;
              const skipped = results.length - created;
              setResult(`${created} facture(s) générée(s), ${skipped} logement(s) sans rien à facturer.`);
              router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Erreur lors de la génération");
            }
          });
        }}
        className="rounded-md bg-[var(--color-ink)] text-white text-sm px-4 py-2 hover:bg-[var(--color-ink)]/90 transition-colors disabled:opacity-50"
      >
        {isPending ? "Génération..." : "Lancer"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
      >
        Fermer
      </button>
      {result ? <p className="text-xs text-[var(--color-success)]">{result}</p> : null}
      {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
    </div>
  );
}
