import Link from "next/link";
import { getCurrentUserMembership } from "@/lib/auth-guard";
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

const STATUS_STYLES: Record<string, string> = {
  TO_PLAN: "bg-[var(--color-ink)]/5 text-[var(--color-ink-soft)]",
  PLANNED: "bg-[var(--color-brass)]/10 text-[var(--color-brass-dark)]",
  ASSIGNED: "bg-[var(--color-brass)]/10 text-[var(--color-brass-dark)]",
  ACCEPTED: "bg-[var(--color-brass)]/10 text-[var(--color-brass-dark)]",
  IN_PROGRESS: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  DONE: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  TO_REVIEW: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  VALIDATED: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  REFUSED: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
  CANCELLED: "bg-[var(--color-ink)]/5 text-[var(--color-ink-soft)]",
  LATE: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
};

export default async function MissionsPage() {
  const membership = await getCurrentUserMembership();
  const missions = membership ? await listMissionsAction(membership.companyId) : [];

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--color-ink)]">
          Missions
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-1">
          {missions.length} mission{missions.length > 1 ? "s" : ""} — générées automatiquement à la clôture des
          réservations, ou créées manuellement.
        </p>
      </header>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-paper)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] border-b border-[var(--color-line)]">
            <tr>
              <th className="px-5 py-3.5">Date</th>
              <th className="px-5 py-3.5">Type</th>
              <th className="px-5 py-3.5">Logement</th>
              <th className="px-5 py-3.5">Intervenant</th>
              <th className="px-5 py-3.5">Priorité</th>
              <th className="px-5 py-3.5">Statut</th>
            </tr>
          </thead>
          <tbody>
            {missions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-ink-soft)]">
                  Aucune mission pour le moment. Les missions sont générées automatiquement lors de l&apos;import de
                  réservations.
                </td>
              </tr>
            ) : (
              missions.map((mission) => (
                <tr
                  key={mission.id}
                  className="border-t border-[var(--color-line)] transition-colors hover:bg-[var(--color-paper)]"
                >
                  <td className="px-5 py-3.5 font-medium">
                    <Link href={`/missions/${mission.id}`} className="hover:text-[var(--color-brass-dark)] hover:underline">
                      {format(new Date(mission.scheduledDate), "dd MMM yyyy", { locale: fr })}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">{TYPE_LABELS[mission.type] ?? mission.type}</td>
                  <td className="px-5 py-3.5">{mission.property.name}</td>
                  <td className="px-5 py-3.5 text-[var(--color-ink-soft)]">
                    {mission.employee ? `${mission.employee.firstName} ${mission.employee.lastName}` : "Non affectée"}
                  </td>
                  <td className="px-5 py-3.5">{mission.priority}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[mission.status] ?? ""}`}
                    >
                      {STATUS_LABELS[mission.status] ?? mission.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
