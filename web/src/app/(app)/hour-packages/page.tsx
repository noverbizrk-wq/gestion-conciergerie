import { getCurrentUserMembership } from "@/lib/auth-guard";
import { listHourPackagesAction } from "@/modules/hour-packages/actions";
import { listOwnersAction } from "@/modules/owners/actions";
import { NewPackageForm } from "./new-package-form";
import { ConsumeButton } from "./consume-button";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  CONSUMED: "Épuisé",
  EXPIRED: "Expiré",
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  CONSUMED: "bg-[var(--color-ink)]/5 text-[var(--color-ink-soft)]",
  EXPIRED: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
};

export default async function HourPackagesPage() {
  const membership = await getCurrentUserMembership();
  if (!membership) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--color-line)] p-8 text-sm text-[var(--color-ink-soft)]">
        Votre compte n&apos;est rattaché à aucune société pour le moment.
      </div>
    );
  }

  const [packages, owners] = await Promise.all([
    listHourPackagesAction(membership.companyId),
    listOwnersAction(membership.companyId),
  ]);

  return (
    <div>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--color-ink)]">
            Packs d&apos;heures
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            {packages.length} pack{packages.length > 1 ? "s" : ""} d&apos;heures prépayées
          </p>
        </div>
        <NewPackageForm
          companyId={membership.companyId}
          owners={owners.map((o) => ({ id: o.id, firstName: o.firstName, lastName: o.lastName }))}
        />
      </header>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-paper)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] border-b border-[var(--color-line)]">
            <tr>
              <th className="px-5 py-3.5">Client</th>
              <th className="px-5 py-3.5">Heures totales</th>
              <th className="px-5 py-3.5">Consommées</th>
              <th className="px-5 py-3.5">Restantes</th>
              <th className="px-5 py-3.5">Prix / heure</th>
              <th className="px-5 py-3.5">Expire le</th>
              <th className="px-5 py-3.5">Statut</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {packages.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[var(--color-ink-soft)]">
                  Aucun pack d&apos;heures pour le moment.
                </td>
              </tr>
            ) : (
              packages.map((pack) => {
                const remaining = Number(pack.totalHours) - Number(pack.usedHours);
                return (
                  <tr key={pack.id} className="border-t border-[var(--color-line)] transition-colors hover:bg-[var(--color-paper)]">
                    <td className="px-5 py-3.5 font-medium">
                      {pack.owner.firstName} {pack.owner.lastName}
                    </td>
                    <td className="px-5 py-3.5">{Number(pack.totalHours)}h</td>
                    <td className="px-5 py-3.5">{Number(pack.usedHours)}h</td>
                    <td className="px-5 py-3.5">{remaining}h</td>
                    <td className="px-5 py-3.5">{Number(pack.pricePerHour).toLocaleString("fr-FR")} €</td>
                    <td className="px-5 py-3.5">
                      {pack.expiresAt ? pack.expiresAt.toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[pack.status]}`}>
                        {STATUS_LABELS[pack.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {pack.status === "ACTIVE" ? (
                        <ConsumeButton packageId={pack.id} companyId={membership.companyId} />
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
