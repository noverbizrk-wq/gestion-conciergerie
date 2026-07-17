"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { consumeHourPackageAction } from "@/modules/hour-packages/actions";

export function ConsumeButton({ packageId, companyId }: { packageId: string; companyId: string }) {
  const [hours, setHours] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={0.5}
        step="0.5"
        value={hours}
        onChange={(e) => setHours(Number(e.target.value))}
        className="w-16 rounded-md border border-[var(--color-line)] bg-white px-2 py-1 text-xs"
      />
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await consumeHourPackageAction(packageId, companyId, hours);
              router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Erreur");
            }
          });
        }}
        className="rounded-md border border-[var(--color-line)] text-xs px-2 py-1 hover:border-[var(--color-brass)] transition-colors disabled:opacity-50"
      >
        Consommer
      </button>
      {error ? <span className="text-[10px] text-[var(--color-danger)]">{error}</span> : null}
    </div>
  );
}
