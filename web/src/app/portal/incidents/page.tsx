import { getPortalIncidentsAction } from "@/modules/portal/actions";

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

export default async function PortalIncidentsPage() {
  const incidents = await getPortalIncidentsAction();

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-ink)] mb-1">Incidents</h1>
      <p className="text-sm text-[var(--color-ink-soft)] mb-6">
        Suivi des incidents déclarés sur vos logements (lecture seule).
      </p>
      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-paper)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] border-b border-[var(--color-line)]">
            <tr>
              <th className="px-5 py-3.5">Logement</th>
              <th className="px-5 py-3.5">Catégorie</th>
              <th className="px-5 py-3.5">Statut</th>
            </tr>
          </thead>
          <tbody>
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-[var(--color-ink-soft)]">
                  Aucun incident signalé.
                </td>
              </tr>
            ) : (
              incidents.map((incident) => (
                <tr key={incident.id} className="border-t border-[var(--color-line)]">
                  <td className="px-5 py-3.5 font-medium">{incident.property.name}</td>
                  <td className="px-5 py-3.5">{CATEGORY_LABELS[incident.category] ?? incident.category}</td>
                  <td className="px-5 py-3.5">{STATUS_LABELS[incident.status] ?? incident.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
