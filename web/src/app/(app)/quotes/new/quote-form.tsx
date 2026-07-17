"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createQuotationAction } from "@/modules/quotations/actions";

type Owner = { id: string; firstName: string; lastName: string };
type Property = { id: string; name: string; ownerId: string };

type Line = { description: string; quantity: number; unitPriceHT: number; vatRate: number };

const EMPTY_LINE: Line = { description: "", quantity: 1, unitPriceHT: 0, vatRate: 20 };

export function QuoteForm({
  companyId,
  owners,
  properties,
}: {
  companyId: string;
  owners: Owner[];
  properties: Property[];
}) {
  const [ownerId, setOwnerId] = useState(owners[0]?.id ?? "");
  const [propertyId, setPropertyId] = useState("");
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [lines, setLines] = useState<Line[]>([{ ...EMPTY_LINE }]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const availableProperties = properties.filter((p) => p.ownerId === ownerId);
  const total = lines.reduce((acc, l) => acc + l.quantity * l.unitPriceHT * (1 + l.vatRate / 100), 0);

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-ink-soft)]">Client</label>
          <select
            value={ownerId}
            onChange={(e) => {
              setOwnerId(e.target.value);
              setPropertyId("");
            }}
            className="w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
          >
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.firstName} {o.lastName}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-ink-soft)]">Logement (optionnel)</label>
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
          >
            <option value="">—</option>
            {availableProperties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-ink-soft)]">Valide jusqu&apos;au</label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-[var(--color-ink-soft)]">Lignes du devis</label>
          <button
            type="button"
            onClick={() => setLines((prev) => [...prev, { ...EMPTY_LINE }])}
            className="text-xs text-[var(--color-brass-dark)] hover:underline"
          >
            + Ajouter une ligne
          </button>
        </div>
        <div className="space-y-2">
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input
                type="text"
                placeholder="Description"
                value={line.description}
                onChange={(e) => updateLine(i, { description: e.target.value })}
                className="col-span-5 rounded-md border border-[var(--color-line)] bg-white px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                min={0}
                step="0.5"
                placeholder="Qté"
                value={line.quantity}
                onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
                className="col-span-2 rounded-md border border-[var(--color-line)] bg-white px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="Prix HT"
                value={line.unitPriceHT}
                onChange={(e) => updateLine(i, { unitPriceHT: Number(e.target.value) })}
                className="col-span-2 rounded-md border border-[var(--color-line)] bg-white px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                min={0}
                step="0.1"
                placeholder="TVA %"
                value={line.vatRate}
                onChange={(e) => updateLine(i, { vatRate: Number(e.target.value) })}
                className="col-span-2 rounded-md border border-[var(--color-line)] bg-white px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={lines.length === 1}
                className="col-span-1 text-xs text-[var(--color-danger)] disabled:opacity-30"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-4">
        <p className="text-sm">
          Total TTC estimé :{" "}
          <span className="font-[family-name:var(--font-display)] text-lg text-[var(--color-brass-dark)]">
            {total.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €
          </span>
        </p>
        <div className="flex items-center gap-3">
          {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
          <button
            type="button"
            disabled={isPending || !ownerId}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  const quotation = await createQuotationAction({
                    companyId,
                    ownerId,
                    propertyId: propertyId || undefined,
                    validUntil,
                    lines: lines.filter((l) => l.description.trim().length > 0),
                  });
                  router.push(`/quotes/${quotation.id}`);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Erreur lors de la création du devis");
                }
              });
            }}
            className="rounded-md bg-[var(--color-ink)] text-white text-sm px-5 py-2.5 hover:bg-[var(--color-ink)]/90 transition-colors disabled:opacity-50"
          >
            {isPending ? "Création..." : "Créer le devis"}
          </button>
        </div>
      </div>
    </div>
  );
}
