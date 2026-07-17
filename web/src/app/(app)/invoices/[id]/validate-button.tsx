"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { validateInvoiceAction } from "@/modules/invoicing/actions";

export function ValidateInvoiceButton({ invoiceId, companyId }: { invoiceId: string; companyId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await validateInvoiceAction(invoiceId, companyId);
          router.refresh();
        });
      }}
      className="rounded-md bg-[var(--color-brass)] text-white text-sm px-4 py-2 hover:bg-[var(--color-brass-dark)] transition-colors disabled:opacity-60"
    >
      {isPending ? "Validation..." : "Valider la facture"}
    </button>
  );
}
