import Link from "next/link";
import { getCurrentUserMembership, getCurrentEmployeeProfile } from "@/lib/auth-guard";
import { listIncidentsAction } from "@/modules/incidents/actions";
import { listPropertiesAction } from "@/modules/properties/actions";
import { listMissionsAction } from "@/modules/missions/actions";
import { IncidentsToolbar } from "./incidents-toolbar";

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

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Ouvert",
  IN_PROGRESS: "En cours",
  RESOLVED: "Résolu",
  CLOSED: "Clôturé",
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
  IN_PROGRESS: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  RESOLVED: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  CLOSED: "bg-[var(--color-ink)]/5 text-[var(--color-ink-soft)]",
};

const PROPERTY_LIST_ROLES = ["ADMIN", "SUPER_ADMIN", "OPERATIONAL_MANAGER", "ACCOUNTANT", "READONLY"];

/**
 * Pour un AGENT (intervenant), on ne peut pas lister tous les logements de la
 * société (listPropertiesAction le lui interdit). On dérive à la place la
 * liste des logements liés à ses missions, pour alimenter le sélecteur du
 * formulaire "Signaler un incident".
 */
async function getAgentProperties(companyId: string) {
  const employee = await getCurrentEmployeeProfile(companyId);
  if (!employee) return [];
  const missions = await listMissionsAction(companyId, { employeeId: employee.id });
  const seen = new Map<string, { id: string; name: string }>();
  for (const mission of missions) {
    if (!seen.has(mission.property.id)) {
      seen.set(mission.property.id, { id: mission.property.id, name: mission.property.name });
    }
  }
  return Array.from(seen.values());
}

export default async function IncidentsPage() {
  const membership = await getCurrentUserMembership();
  // listPropertiesAction n'est pas ouvert au rôle AGENT (intervenant) : la
  // liste complète des logements ne sert qu'au formulaire de création
  // d'incident côté staff. Un AGENT peut lister/consulter les incidents
  // (listIncidentsAction l'autorise) mais pour le formulaire "Signaler un
  // incident" on lui propose uniquement les logements de ses missions —
  // sans quoi le sélecteur de logement reste vide et bloque la création.
  const canListProperties = Boolean(membership && PROPERTY_LIST_ROLES.includes(membership.role));
  const isAgent = membership?.role === "AGENT";

  const [incidents, properties, agentProperties] = membership
    ? await Promise.all([
        listIncidentsAction(membership.companyId),
        canListProperties ? listPropertiesAction(membership.companyId) : Promise.resolve([]),
        isAgent ? getAgentProperties(membership.companyId) : Promise.resolve([]),
      ])
    : [[], [], []];

  const availableProperties = isAgent ? agentProperties : properties;

  return (
    <div>
      <IncidentsToolbar
        companyId={membership?.companyId ?? ""}
        properties={availableProperties.map((p) => ({ id: p.id, name: p.name }))}
        count={incidents.length}
      />

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-paper)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] border-b border-[var(--color-line)]">
            <tr>
              <th className="px-5 py-3.5">Logement</th>
              <th className="px-5 py-3.5">Catégorie</th>
              <th className="px-5 py-3.5">Priorité</th>
              <th className="px-5 py-3.5">Responsable</th>
              <th className="px-5 py-3.5">Statut</th>
            </tr>
          </thead>
          <tbody>
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-ink-soft)]">
                  Aucun incident pour le moment.
                </td>
              </tr>
            ) : (
              incidents.map((incident) => (
                <tr key={incident.id} className="border-t border-[var(--color-line)] transition-colors hover:bg-[var(--color-paper)]">
                  <td className="px-5 py-3.5 font-medium">
                    <Link href={`/incidents/${incident.id}`} className="hover:text-[var(--color-brass-dark)] hover:underline">
                      {incident.property.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">{CATEGORY_LABELS[incident.category] ?? incident.category}</td>
                  <td className="px-5 py-3.5">{incident.priority}</td>
                  <td className="px-5 py-3.5 text-[var(--color-ink-soft)]">
                    {incident.responsibleEmployee
                      ? `${incident.responsibleEmployee.firstName} ${incident.responsibleEmployee.lastName}`
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[incident.status] ?? ""}`}>
                      {STATUS_LABELS[incident.status] ?? incident.status}
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
