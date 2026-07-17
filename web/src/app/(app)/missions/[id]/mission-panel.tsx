"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  assignMissionAction,
  updateMissionStatusAction,
  toggleMissionTaskAction,
  addMissionPhotoAction,
} from "@/modules/missions/actions";
import { createIncidentAction } from "@/modules/incidents/actions";

const INCIDENT_CATEGORY_LABELS: Record<string, string> = {
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

const STATUS_LABELS: Record<string, string> = {
  TO_PLAN: "À planifier",
  PLANNED: "Planifiée",
  ASSIGNED: "Affectée",
  ACCEPTED: "Acceptée",
  IN_PROGRESS: "En cours",
  DONE: "Terminée",
  TO_REVIEW: "À contrôler",
  VALIDATED: "Validée",
  REFUSED: "Refusée",
  CANCELLED: "Annulée",
  LATE: "En retard",
};

const NEXT_STATUS_LABEL: Record<string, string> = {
  PLANNED: "Planifier",
  ASSIGNED: "Affecter",
  ACCEPTED: "Accepter la mission",
  IN_PROGRESS: "Démarrer",
  DONE: "Terminer",
  TO_REVIEW: "Envoyer au contrôle",
  VALIDATED: "Valider",
  REFUSED: "Refuser",
  CANCELLED: "Annuler",
};

type Task = {
  id: string;
  label: string;
  category: string;
  required: boolean;
  photoRequired: boolean;
  done: boolean;
};

type Photo = { id: string; phase: string; room: string | null; storagePath: string };

export function MissionPanel({
  missionId,
  companyId,
  propertyId,
  bookingId,
  status,
  employeeId,
  employees,
  tasks,
  photos,
  transitions,
}: {
  missionId: string;
  companyId: string;
  propertyId: string;
  bookingId?: string | null;
  status: string;
  employeeId: string | null;
  employees: { id: string; firstName: string; lastName: string }[];
  tasks: Task[];
  photos: Photo[];
  transitions: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"BEFORE" | "AFTER">("BEFORE");
  const [room, setRoom] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [incidentCategory, setIncidentCategory] = useState("AUTRE");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [incidentReported, setIncidentReported] = useState(false);
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)] mb-3">Affectation</h2>
        <select
          defaultValue={employeeId ?? ""}
          disabled={isPending}
          onChange={(e) => {
            setError(null);
            startTransition(async () => {
              try {
                await assignMissionAction(missionId, companyId, e.target.value || null);
                router.refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Erreur");
              }
            });
          }}
          className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
        >
          <option value="">Non affectée</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.firstName} {e.lastName}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)] mb-3">
          Statut : {STATUS_LABELS[status] ?? status}
        </h2>
        {error ? <p className="text-xs text-[var(--color-danger)] mb-2">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          {transitions.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-soft)]">Aucune transition disponible depuis ce statut.</p>
          ) : (
            transitions.map((next) => (
              <button
                key={next}
                type="button"
                disabled={isPending}
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    try {
                      await updateMissionStatusAction(missionId, companyId, next);
                      router.refresh();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Erreur");
                    }
                  });
                }}
                className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm hover:bg-[var(--color-paper)] transition-colors disabled:opacity-50"
              >
                {NEXT_STATUS_LABEL[next] ?? next}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)] mb-3">
          Checklist ({tasks.filter((t) => t.done).length}/{tasks.length})
        </h2>
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={task.done}
                disabled={isPending}
                onChange={() => {
                  startTransition(async () => {
                    await toggleMissionTaskAction(task.id, missionId, companyId);
                    router.refresh();
                  });
                }}
                className="mt-0.5"
              />
              <span className={task.done ? "line-through text-[var(--color-ink-soft)]" : ""}>
                {task.label}
                {task.required ? <span className="text-[var(--color-danger)]"> *</span> : null}
                {task.photoRequired ? (
                  <span className="text-xs text-[var(--color-ink-soft)]"> (photo requise)</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)] mb-3">
          Photos ({photos.length})
        </h2>
        <div className="space-y-2 mb-4">
          {photos.map((photo) => (
            <a
              key={photo.id}
              href={photo.storagePath}
              target="_blank"
              rel="noreferrer"
              className="block text-sm text-[var(--color-brass-dark)] hover:underline"
            >
              {photo.phase === "BEFORE" ? "Avant" : "Après"} {photo.room ? `— ${photo.room}` : ""}
            </a>
          ))}
          {photos.length === 0 ? <p className="text-sm text-[var(--color-ink-soft)]">Aucune photo.</p> : null}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value as "BEFORE" | "AFTER")}
            className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
          >
            <option value="BEFORE">Avant</option>
            <option value="AFTER">Après</option>
          </select>
          <input
            type="text"
            placeholder="Pièce (optionnel)"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Lien de la photo"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          disabled={isPending || !photoUrl}
          onClick={() => {
            startTransition(async () => {
              try {
                await addMissionPhotoAction({ missionId, companyId, phase, room: room || undefined, storagePath: photoUrl });
                setPhotoUrl("");
                setRoom("");
                router.refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Erreur");
              }
            });
          }}
          className="mt-2 rounded-lg bg-[var(--color-ink)] text-white text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-all disabled:opacity-50"
        >
          Ajouter la photo
        </button>
      </div>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)]">
            Signaler un problème
          </h2>
          {!incidentOpen ? (
            <button
              type="button"
              onClick={() => setIncidentOpen(true)}
              className="text-xs text-[var(--color-danger)] hover:underline"
            >
              + Signaler
            </button>
          ) : null}
        </div>
        {incidentReported ? (
          <p className="text-sm text-[var(--color-success)]">Incident signalé, un responsable va le traiter.</p>
        ) : incidentOpen ? (
          <div className="space-y-2">
            <select
              value={incidentCategory}
              onChange={(e) => setIncidentCategory(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
            >
              {Object.entries(INCIDENT_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Décrivez le problème rencontré"
              value={incidentDescription}
              onChange={(e) => setIncidentDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={isPending || !incidentDescription}
              onClick={() => {
                startTransition(async () => {
                  try {
                    await createIncidentAction({
                      companyId,
                      propertyId,
                      bookingId: bookingId ?? undefined,
                      category: incidentCategory,
                      description: incidentDescription,
                    });
                    setIncidentReported(true);
                    setIncidentOpen(false);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Erreur");
                  }
                });
              }}
              className="rounded-lg bg-[var(--color-danger)] text-white text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-all disabled:opacity-50"
            >
              Envoyer le signalement
            </button>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-ink-soft)]">
            Casse, fuite, dégradation... signale tout problème constaté sur place.
          </p>
        )}
      </div>
    </div>
  );
}
