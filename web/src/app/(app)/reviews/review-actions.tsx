"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateReviewStatusAction } from "@/modules/reviews/actions";

export function ReviewActions({ reviewId, companyId }: { reviewId: string; companyId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function setStatus(status: "PUBLISHED" | "REJECTED") {
    startTransition(async () => {
      await updateReviewStatusAction(reviewId, companyId, status);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => setStatus("PUBLISHED")}
        className="rounded-md bg-[var(--color-success)] text-white text-xs px-3 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        Publier
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setStatus("REJECTED")}
        className="rounded-md border border-[var(--color-danger)] text-[var(--color-danger)] text-xs px-3 py-1.5 hover:bg-[var(--color-danger)]/5 transition-colors disabled:opacity-50"
      >
        Rejeter
      </button>
    </div>
  );
}
