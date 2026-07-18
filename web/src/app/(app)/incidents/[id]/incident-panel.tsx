"use client";

import { useState, useTransition } from "react";
import {
  updateIncidentStatusAction,
  assignIncidentAction,
  createMaintenanceMissionAction,
} from "@/modules/incidents/actions";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Ouvert",
  IN_PROGRESS: "En cours",
  RESOLVED: "Résolu",
  CLOSED: "Clôturé",
};

export function IncidentPanel({
  incidentId,
  companyId,
  status,
  responsibleEmployeeId,
  employees,
  hasMaintenanceMission,
  canManage,
}: {
  incidentId: string;
  companyId: string;
  status: string;
  responsibleEmployeeId: string | null;
  employees: { id: string; firstName: string; lastName: string }[];
  hasMaintenanceMission: boolean;
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const responsibleName = responsibleEmployeeId
    ? employees.find((e) => e.id === responsibleEmployeeId)
      ? `${employees.find((e) => e.id === responsibleEmployeeId)!.firstName} ${employees.find((e) => e.id === responsibleEmployeeId)!.lastName}`
      : "Assigné"
    : "Non assigné";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)] mb-3">Responsable</h2>
        {canManage ? (
          <select
            defaultValue={responsibleEmployeeId ?? ""}
            disabled={isPending}
            onChange={(e) => {
              startTransition(async () => {
                try {
                  await assignIncidentAction(incidentId, companyId, e.target.value || null);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Erreur");
                }
              });
            }}
            className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
          >
            <option value="">Non assigné</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-[var(--color-ink-soft)]">{responsibleName}</p>
        )}
      </div>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)] mb-3">
          Statut : {STATUS_LABELS[status] ?? status}
        </h2>
        {error ? <p className="text-xs text-[var(--color-danger)] mb-2">{error}</p> : null}
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            {(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const)
              .filter((s) => s !== status)
              .map((next) => (
                <button
                  key={next}
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      try {
                        await updateIncidentStatusAction(incidentId, companyId, next);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Erreur");
                      }
                    });
                  }}
                  className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm hover:bg-[var(--color-paper)] transition-colors disabled:opacity-50"
                >
                  {STATUS_LABELS[next]}
                </button>
              ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-ink-soft)]">
            Seul un responsable opérationnel peut changer le statut de cet incident.
          </p>
        )}
      </div>

      {canManage ? (
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)] mb-3">Maintenance</h2>
          {hasMaintenanceMission ? (
            <p className="text-sm text-[var(--color-ink-soft)]">Une mission de maintenance existe déjà pour cet incident.</p>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  try {
                    await createMaintenanceMissionAction(incidentId, companyId);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Erreur");
                  }
                });
              }}
              className="rounded-lg bg-[var(--color-ink)] text-white text-sm px-4 py-2 hover:bg-[var(--color-brass-dark)] transition-colors disabled:opacity-50"
            >
              Créer une mission de maintenance
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
