"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBookingStatusAction } from "@/modules/bookings-import/actions";

const OPTIONS: { value: "IMPORTED" | "INVOICED" | "IGNORED"; label: string }[] = [
  { value: "IMPORTED", label: "Importée" },
  { value: "INVOICED", label: "Facturée" },
  { value: "IGNORED", label: "Ignorée" },
];

export function BookingStatusForm({
  bookingId,
  companyId,
  currentStatus,
}: {
  bookingId: string;
  companyId: string;
  currentStatus: "IMPORTED" | "INVOICED" | "IGNORED";
}) {
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-4 space-y-3">
      <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Changer le statut</p>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as typeof status)}
        className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optionnel)"
        rows={2}
        className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
      />
      <button
        type="button"
        disabled={isPending || status === currentStatus}
        onClick={() => {
          startTransition(async () => {
            await updateBookingStatusAction(bookingId, companyId, status, note || undefined);
            setNote("");
            router.refresh();
          });
        }}
        className="w-full rounded-lg bg-[var(--color-ink)] text-white text-sm py-2 hover:bg-[var(--color-ink)]/90 transition-colors disabled:opacity-50"
      >
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </div>
  );
}
