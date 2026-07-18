"use client";

import { useState, useTransition } from "react";
import { createIncidentAction } from "@/modules/incidents/actions";

const CATEGORY_LABELS: Record<string, string> = {
  CASSE: "Casse",
  FUITE: "Fuite",
  ELECTRICITE: "Électricité",
  PLOMBERIE: "Plomberie",
  SERRURERIE: "Serrurerie",
  ELECTROMENAGER: "Électroménager",
  PROPRETE: "Propreté",
  NUISIBLES: "Nuisibles",
  CHAUFFAGE: "Chauffage",
  INTERNET: "Internet",
  VOISINAGE: "Voisinage",
  DEGRADATION_VOYAGEUR: "Dégradation voyageur",
  AUTRE: "Autre",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Faible",
  NORMAL: "Normale",
  HIGH: "Haute",
  URGENT: "Urgente",
};

export function IncidentsToolbar({
  companyId,
  properties,
  count,
}: {
  companyId: string;
  properties: { id: string; name: string }[];
  count: number;
}) {
  const [open, setOpen] = useState(false);
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [category, setCategory] = useState("AUTRE");
  const [priority, setPriority] = useState("NORMAL");
  const [description, setDescription] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--color-ink)]">
            Incidents
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            {count} incident{count > 1 ? "s" : ""} enregistré{count > 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={!companyId || properties.length === 0}
          className="rounded-lg bg-[var(--color-ink)] text-white text-sm px-4 py-2 hover:bg-[var(--color-brass-dark)] transition-colors disabled:opacity-50"
        >
          {open ? "Fermer" : "Signaler un incident"}
        </button>
      </div>

      {open ? (
        <div className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
            >
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              placeholder="Coût estimé (€)"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
            />
            <textarea
              placeholder="Description de l'incident"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20 md:col-span-2"
            />
          </div>
          {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isPending || !description || !propertyId}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  try {
                    await createIncidentAction({
                      companyId,
                      propertyId,
                      category,
                      description,
                      priority,
                      estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
                    });
                    setDescription("");
                    setEstimatedCost("");
                    setOpen(false);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Erreur lors du signalement");
                  }
                });
              }}
              className="rounded-lg bg-[var(--color-ink)] text-white text-sm font-medium px-4 py-2 shadow-sm hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isPending ? "Envoi..." : "Signaler"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
