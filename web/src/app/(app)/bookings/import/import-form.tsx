"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  previewImportAction,
  confirmImportAction,
  type ImportPreviewRow,
} from "@/modules/bookings-import/actions";

type Property = { id: string; name: string };

export function ImportForm({ companyId, properties }: { companyId: string; properties: Property[] }) {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreviewRow[] | null>(null);
  const [parseErrors, setParseErrors] = useState<{ line: number; message: string }[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleFile(file: File) {
    setError(null);
    setPreview(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? "");
      setFileContent(content);
      startTransition(async () => {
        try {
          const result = await previewImportAction(companyId, content);
          setPreview(result.preview);
          setParseErrors(result.parseErrors ?? []);
          const initialMapping: Record<string, string> = {};
          for (const row of result.preview) {
            if (row.matchedPropertyId) initialMapping[row.externalId] = row.matchedPropertyId;
          }
          setMapping(initialMapping);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Erreur lors de la lecture du fichier");
        }
      });
    };
    reader.readAsText(file);
  }

  const unresolvedCount = preview?.filter((r) => !mapping[r.externalId]).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-dashed border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6 text-center">
        <label className="cursor-pointer">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <span className="text-sm text-[var(--color-brass-dark)] hover:underline">
            {fileName ?? "Choisir un fichier CSV Airbnb"}
          </span>
        </label>
        <p className="text-xs text-[var(--color-ink-soft)] mt-2">
          Export de réservations Airbnb au format CSV.
        </p>
      </div>

      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}

      {parseErrors.length > 0 ? (
        <div className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 p-4 text-xs text-[var(--color-danger)]">
          <p className="font-medium mb-1">{parseErrors.length} ligne(s) en erreur :</p>
          <ul className="list-disc list-inside space-y-0.5">
            {parseErrors.slice(0, 10).map((err, i) => (
              <li key={i}>Ligne {err.line} : {err.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {preview && preview.length > 0 ? (
        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-raised)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-paper)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              <tr>
                <th className="px-4 py-3">Annonce (CSV)</th>
                <th className="px-4 py-3">Logement rapproché</th>
                <th className="px-4 py-3">Arrivée</th>
                <th className="px-4 py-3">Départ</th>
                <th className="px-4 py-3">Montant brut</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((row) => (
                <tr key={row.externalId} className="border-t border-[var(--color-line)]">
                  <td className="px-4 py-3">{row.propertyNameRaw}</td>
                  <td className="px-4 py-3">
                    <select
                      value={mapping[row.externalId] ?? ""}
                      onChange={(e) =>
                        setMapping((prev) => ({ ...prev, [row.externalId]: e.target.value }))
                      }
                      className={`rounded-md border px-2 py-1 text-xs ${
                        mapping[row.externalId] ? "border-[var(--color-line)]" : "border-[var(--color-danger)]"
                      }`}
                    >
                      <option value="">— à sélectionner —</option>
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">{new Date(row.checkIn).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3">{new Date(row.checkOut).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3">{row.grossAmount.toLocaleString("fr-FR")} €</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-[var(--color-line)] flex items-center justify-between">
            <p className="text-xs text-[var(--color-ink-soft)]">
              {unresolvedCount > 0
                ? `${unresolvedCount} ligne(s) sans logement rapproché — complète le mapping avant de confirmer.`
                : `${preview.length} réservation(s) prête(s) à être importées.`}
            </p>
            <button
              type="button"
              disabled={isPending || unresolvedCount > 0 || !fileContent}
              onClick={() => {
                startTransition(async () => {
                  try {
                    await confirmImportAction(companyId, fileContent!, mapping);
                    router.push("/bookings");
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Erreur lors de l'import");
                  }
                });
              }}
              className="rounded-md bg-[var(--color-brass)] text-white text-sm px-4 py-2 hover:bg-[var(--color-brass-dark)] transition-colors disabled:opacity-50"
            >
              {isPending ? "Import..." : "Confirmer l'import"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
