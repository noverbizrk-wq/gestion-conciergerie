import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getCurrentUserMembership } from "@/lib/auth-guard";
import { getMissionAction } from "@/modules/missions/actions";
import { listEmployeesAction } from "@/modules/employees/actions";
import { MISSION_TRANSITIONS } from "@/modules/missions/transitions";
import { MissionPanel } from "./mission-panel";

const TYPE_LABELS: Record<string, string> = {
  CLEANING: "Ménage",
  QUALITY_CONTROL: "Contrôle qualité",
  LAUNDRY: "Blanchisserie",
  MAINTENANCE: "Maintenance",
  CHECKIN_PREP: "Préparation check-in",
};

export default async function MissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const membership = await getCurrentUserMembership();
  if (!membership) notFound();

  const mission = await getMissionAction(id, membership.companyId);
  if (!mission) notFound();

  // La liste des intervenants (pour réaffecter la mission) n'est utile qu'au
  // staff de gestion : un AGENT consultant sa propre mission n'a pas accès à
  // listEmployeesAction (rôle insuffisant), on ne doit donc pas planter la
  // page pour lui — on lui passe simplement une liste vide.
  const MANAGE_ROLES = ["ADMIN", "SUPER_ADMIN", "OPERATIONAL_MANAGER", "ACCOUNTANT", "READONLY"];
  const employees = MANAGE_ROLES.includes(membership.role)
    ? await listEmployeesAction(membership.companyId)
    : [];

  return (
    <div>
      <Link
        href="/missions"
        className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
      >
        ← Retour aux missions
      </Link>

      <header className="mt-2 mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--color-ink)]">
          {TYPE_LABELS[mission.type] ?? mission.type} — {mission.property.name}
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-1">
          Prévue le {format(new Date(mission.scheduledDate), "dd MMMM yyyy", { locale: fr })}
          {mission.booking ? ` — réservation ${mission.booking.externalId}` : ""}
        </p>
        {mission.instructions ? (
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">{mission.instructions}</p>
        ) : null}
      </header>

      <div className="max-w-2xl">
        <MissionPanel
          missionId={mission.id}
          companyId={membership.companyId}
          propertyId={mission.propertyId}
          bookingId={mission.bookingId}
          status={mission.status}
          employeeId={mission.employeeId}
          employees={employees.map((e) => ({ id: e.id, firstName: e.firstName, lastName: e.lastName }))}
          tasks={mission.tasks.map((t) => ({
            id: t.id,
            label: t.label,
            category: t.category,
            required: t.required,
            photoRequired: t.photoRequired,
            done: t.done,
          }))}
          photos={mission.photos.map((p) => ({
            id: p.id,
            phase: p.phase,
            room: p.room,
            storagePath: p.storagePath,
          }))}
          transitions={MISSION_TRANSITIONS[mission.status] ?? []}
        />
      </div>
    </div>
  );
}
