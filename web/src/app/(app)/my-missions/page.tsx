import Link from "next/link";
import { getCurrentUserMembership } from "@/lib/auth-guard";
import { getMyEmployeeProfileAction } from "@/modules/employees/actions";
import { listMissionsAction } from "@/modules/missions/actions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const TYPE_LABELS: Record<string, string> = {
  CLEANING: "Ménage",
  QUALITY_CONTROL: "Contrôle qualité",
  LAUNDRY: "Blanchisserie",
  MAINTENANCE: "Maintenance",
  CHECKIN_PREP: "Préparation check-in",
};

const STATUS_LABELS: Record<string, string> = {
  TO_PLAN: "À planifier",
  PLANNED: "Planifiée",
  ASSIGNED: "Affectée — à accepter",
  ACCEPTED: "Acceptée",
  IN_PROGRESS: "En cours",
  DONE: "Terminée",
  TO_REVIEW: "À contrôler",
  VALIDATED: "Validée",
  REFUSED: "Refusée",
  CANCELLED: "Annulée",
  LATE: "En retard",
};

const STATUS_STYLES: Record<string, string> = {
  ASSIGNED: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  ACCEPTED: "bg-[var(--color-brass)]/10 text-[var(--color-brass-dark)]",
  IN_PROGRESS: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  DONE: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  VALIDATED: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
};

/**
 * Vue "Mes missions" — pensée pour un usage mobile par l'intervenant de terrain :
 * une seule colonne, cartes compactes, accès direct à la mission du jour. Reprend
 * les mêmes données que /missions mais filtrées sur l'intervenant connecté.
 */
export default async function MyMissionsPage() {
  const membership = await getCurrentUserMembership();
  if (!membership) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--color-line)] p-8 text-sm text-[var(--color-ink-soft)]">
        Votre compte n&apos;est rattaché à aucune société pour le moment.
      </div>
    );
  }

  const employee = await getMyEmployeeProfileAction(membership.companyId);

  if (!employee) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--color-line)] p-8 text-sm text-[var(--color-ink-soft)]">
        Aucun profil intervenant n&apos;est lié à ce compte. Contactez un administrateur pour être rattaché à une
        fiche intervenant.
      </div>
    );
  }

  const missions = await listMissionsAction(membership.companyId, { employeeId: employee.id });
  const active = missions.filter((m) => !["VALIDATED", "CANCELLED", "REFUSED"].includes(m.status));
  const done = missions.filter((m) => ["VALIDATED", "CANCELLED", "REFUSED"].includes(m.status));

  return (
    <div className="max-w-md mx-auto">
      <header className="mb-5">
        <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--color-ink)]">
          Mes missions
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-1">
          {employee.firstName} {employee.lastName}
        </p>
      </header>

      <div className="space-y-3">
        {active.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-soft)]">Aucune mission en cours.</p>
        ) : (
          active.map((mission) => (
            <Link
              key={mission.id}
              href={`/missions/${mission.id}`}
              className="block rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-4 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-[var(--color-ink)]">{TYPE_LABELS[mission.type] ?? mission.type}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[mission.status] ?? "bg-[var(--color-ink)]/5 text-[var(--color-ink-soft)]"}`}>
                  {STATUS_LABELS[mission.status] ?? mission.status}
                </span>
              </div>
              <p className="text-sm text-[var(--color-ink-soft)]">{mission.property.name}</p>
              <p className="text-xs text-[var(--color-ink-soft)] mt-1">
                {format(new Date(mission.scheduledDate), "EEEE d MMMM", { locale: fr })}
              </p>
            </Link>
          ))
        )}
      </div>

      {done.length > 0 ? (
        <div className="mt-8">
          <h2 className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)] mb-2">Terminées</h2>
          <div className="space-y-2">
            {done.map((mission) => (
              <Link
                key={mission.id}
                href={`/missions/${mission.id}`}
                className="block rounded-lg border border-[var(--color-line)] px-4 py-2.5 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-paper)] transition-colors"
              >
                {TYPE_LABELS[mission.type] ?? mission.type} — {mission.property.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
