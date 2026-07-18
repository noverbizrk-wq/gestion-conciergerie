import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUserMembership } from "@/lib/auth-guard";
import { getIncidentAction } from "@/modules/incidents/actions";
import { listEmployeesAction } from "@/modules/employees/actions";
import { IncidentPanel } from "./incident-panel";

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

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const membership = await getCurrentUserMembership();
  if (!membership) notFound();

  const incident = await getIncidentAction(id, membership.companyId);
  if (!incident) notFound();

  // Même garde que sur la page de détail mission : listEmployeesAction est
  // réservée aux rôles de gestion, un AGENT consultant un incident (par
  // exemple celui qu'il vient de signaler) ne doit pas faire planter la page.
  const EMPLOYEE_LIST_ROLES = ["ADMIN", "SUPER_ADMIN", "OPERATIONAL_MANAGER", "ACCOUNTANT", "READONLY"];
  const employees = EMPLOYEE_LIST_ROLES.includes(membership.role)
    ? await listEmployeesAction(membership.companyId)
    : [];

  // assignIncidentAction / updateIncidentStatusAction / createMaintenanceMissionAction
  // sont réservées à ["ADMIN", "SUPER_ADMIN", "OPERATIONAL_MANAGER"] (pas AGENT) :
  // un intervenant consultant l'incident qu'il a signalé doit voir un panneau en
  // lecture seule plutôt que des boutons qui échoueront systématiquement.
  const INCIDENT_MANAGE_ROLES = ["ADMIN", "SUPER_ADMIN", "OPERATIONAL_MANAGER"];
  const canManage = INCIDENT_MANAGE_ROLES.includes(membership.role);

  return (
    <div>
      <Link
        href="/incidents"
        className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
      >
        ← Retour aux incidents
      </Link>

      <header className="mt-2 mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--color-ink)]">
          {CATEGORY_LABELS[incident.category] ?? incident.category} — {incident.property.name}
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-1">{incident.description}</p>
        {incident.estimatedCost ? (
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            Coût estimé : {Number(incident.estimatedCost).toLocaleString("fr-FR")} €
          </p>
        ) : null}
      </header>

      <div className="max-w-2xl">
        <IncidentPanel
          incidentId={incident.id}
          companyId={membership.companyId}
          status={incident.status}
          responsibleEmployeeId={incident.responsibleEmployeeId}
          employees={employees.map((e) => ({ id: e.id, firstName: e.firstName, lastName: e.lastName }))}
          hasMaintenanceMission={incident.missions.length > 0}
          canManage={canManage}
        />
      </div>
    </div>
  );
}
