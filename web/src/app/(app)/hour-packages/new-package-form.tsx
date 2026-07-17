"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createHourPackageAction } from "@/modules/hour-packages/actions";

type Owner = { id: string; firstName: string; lastName: string };

export function NewPackageForm({ companyId, owners }: { companyId: string; owners: Owner[] }) {
  const [open, setOpen] = useState(false);
  const [ownerId, setOwnerId] = useState(owners[0]?.id ?? "");
  const [totalHours, setTotalHours] = useState(10);
  const [pricePerHour, setPricePerHour] = useState(25);
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[var(--color-brass)] text-white text-sm font-medium px-4 py-2 shadow-sm hover:bg-[var(--color-brass-dark)] transition-all active:scale-[0.98]"
      >
        Nouveau pack d&apos;heures
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5 mb-6 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <select
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
        >
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.firstName} {o.lastName}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          step="0.5"
          placeholder="Heures"
          value={totalHours}
          onChange={(e) => setTotalHours(Number(e.target.value))}
          className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
        />
        <input
          type="number"
          min={0}
          step="0.5"
          placeholder="Prix / heure HT"
          value={pricePerHour}
          onChange={(e) => setPricePerHour(Number(e.target.value))}
          className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
        />
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
        />
      </div>
      {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isPending || !ownerId}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                await createHourPackageAction({
                  companyId,
                  ownerId,
                  totalHours,
                  pricePerHour,
                  expiresAt: expiresAt || undefined,
                });
                setOpen(false);
                router.refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Erreur lors de la création");
              }
            });
          }}
          className="rounded-lg bg-[var(--color-ink)] text-white text-sm font-medium px-4 py-2 shadow-sm hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isPending ? "Création..." : "Créer le pack"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
