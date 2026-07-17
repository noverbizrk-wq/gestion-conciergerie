"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createReviewAction } from "@/modules/reviews/actions";

type Property = { id: string; name: string };

export function NewReviewForm({ companyId, properties }: { companyId: string; properties: Property[] }) {
  const [open, setOpen] = useState(false);
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
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
        Enregistrer un avis manuellement
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-5 mb-6 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          className="rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
        >
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Nom du voyageur (optionnel)"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
        />
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
        >
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {"★".repeat(r)}
              {"☆".repeat(5 - r)}
            </option>
          ))}
        </select>
      </div>
      <textarea
        placeholder="Commentaire (optionnel)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        className="w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
      />
      {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isPending || !propertyId}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                await createReviewAction({ companyId, propertyId, authorName, rating, comment });
                setAuthorName("");
                setComment("");
                setOpen(false);
                router.refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement");
              }
            });
          }}
          className="rounded-md bg-[var(--color-ink)] text-white text-sm px-4 py-2 hover:bg-[var(--color-ink)]/90 transition-colors disabled:opacity-50"
        >
          {isPending ? "Enregistrement..." : "Enregistrer l'avis"}
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
