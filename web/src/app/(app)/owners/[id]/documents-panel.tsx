"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDocumentAction, deleteDocumentAction, type DocumentType } from "@/modules/documents/actions";

const TYPE_LABELS: Record<DocumentType, string> = {
  CONTRAT: "Contrat",
  RIB: "RIB",
  PIECE_IDENTITE: "Pièce d'identité",
  AUTRE: "Autre",
};

type Doc = { id: string; type: DocumentType; storagePath: string; uploadedAt: string };

export function DocumentsPanel({
  ownerId,
  companyId,
  documents,
}: {
  ownerId: string;
  companyId: string;
  documents: Doc[];
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<DocumentType>("CONTRAT");
  const [storagePath, setStoragePath] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)]">
          Documents ({documents.length})
        </h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xs text-[var(--color-brass-dark)] hover:underline"
        >
          {open ? "Fermer" : "+ Ajouter"}
        </button>
      </div>

      {open ? (
        <div className="mb-4 space-y-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as DocumentType)}
            className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
          >
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Lien du document (Drive, Dropbox...)"
            value={storagePath}
            onChange={(e) => setStoragePath(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
          />
          {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
          <button
            type="button"
            disabled={isPending || !storagePath}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  await createDocumentAction({ ownerId, companyId, type, storagePath });
                  setStoragePath("");
                  setOpen(false);
                  router.refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Erreur lors de l'ajout");
                }
              });
            }}
            className="rounded-lg bg-[var(--color-ink)] text-white text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isPending ? "Ajout..." : "Ajouter"}
          </button>
        </div>
      ) : null}

      {documents.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-soft)]">Aucun document pour le moment.</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-2 text-sm">
              <a
                href={doc.storagePath}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--color-brass-dark)] hover:underline truncate"
              >
                {TYPE_LABELS[doc.type]}
              </a>
              <button
                type="button"
                onClick={() => {
                  startTransition(async () => {
                    await deleteDocumentAction(doc.id, ownerId, companyId);
                    router.refresh();
                  });
                }}
                className="text-xs text-[var(--color-danger)] hover:underline shrink-0"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
