"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateMissionsFromBookingAction } from "@/modules/missions/actions";

export function GenerateMissionsButton({ bookingId, companyId }: { bookingId: string; companyId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div>
      {error ? <p className="text-xs text-[var(--color-danger)] mb-2">{error}</p> : null}
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await generateMissionsFromBookingAction(bookingId, companyId);
              router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Erreur lors de la génération");
            }
          });
        }}
        className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm hover:bg-[var(--color-paper)] transition-colors disabled:opacity-50"
      >
        {isPending ? "Génération..." : "Générer les missions"}
      </button>
    </div>
  );
}
