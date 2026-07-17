"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateQuotationStatusAction,
  convertQuotationToInvoiceAction,
} from "@/modules/quotations/actions";

type Status = "PROPOSED" | "EXPIRED" | "REFUSED" | "ACCEPTED" | "INVOICED" | "ARCHIVED";

const NEXT_ACTIONS: Record<Status, { status: Status; label: string; tone: "brass" | "danger" | "ink" }[]> = {
  PROPOSED: [
    { status: "ACCEPTED", label: "Marquer accepté", tone: "brass" },
    { status: "REFUSED", label: "Marquer refusé", tone: "danger" },
    { status: "EXPIRED", label: "Marquer expiré", tone: "ink" },
  ],
  ACCEPTED: [],
  REFUSED: [{ status: "ARCHIVED", label: "Archiver", tone: "ink" }],
  EXPIRED: [{ status: "ARCHIVED", label: "Archiver", tone: "ink" }],
  INVOICED: [],
  ARCHIVED: [],
};

const TONE_STYLES = {
  brass: "bg-[var(--color-brass)] text-white hover:bg-[var(--color-brass-dark)]",
  danger: "border border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger)]/5",
  ink: "border border-[var(--color-line)] hover:border-[var(--color-brass)]",
};

export function QuotationStatusActions({
  quotationId,
  companyId,
  status,
}: {
  quotationId: string;
  companyId: string;
  status: Status;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const actions = NEXT_ACTIONS[status];

  return (
    <div className="flex items-center gap-2">
      {actions.map((action) => (
        <button
          key={action.status}
          type="button"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await updateQuotationStatusAction(
                quotationId,
                companyId,
                action.status as "PROPOSED" | "EXPIRED" | "REFUSED" | "ACCEPTED" | "ARCHIVED"
              );
              router.refresh();
            });
          }}
          className={`rounded-md text-sm px-4 py-2 transition-colors disabled:opacity-50 ${TONE_STYLES[action.tone]}`}
        >
          {action.label}
        </button>
      ))}
      {status === "ACCEPTED" ? (
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              const invoice = await convertQuotationToInvoiceAction(quotationId, companyId);
              router.push(`/invoices/${invoice.id}`);
            });
          }}
          className="rounded-md bg-[var(--color-ink)] text-white text-sm px-4 py-2 hover:bg-[var(--color-ink)]/90 transition-colors disabled:opacity-50"
        >
          {isPending ? "Conversion..." : "Convertir en facture"}
        </button>
      ) : null}
    </div>
  );
}
