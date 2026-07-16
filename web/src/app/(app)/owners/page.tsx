import { listOwnersAction } from "@/modules/owners/actions";

const DEMO_COMPANY_ID = process.env.DEMO_COMPANY_ID ?? "";

export default async function OwnersPage() {
  const owners = DEMO_COMPANY_ID ? await listOwnersAction(DEMO_COMPANY_ID) : [];

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-ink)]">
            Propriétaires
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            {owners.length} propriétaire{owners.length > 1 ? "s" : ""} enregistré{owners.length > 1 ? "s" : ""}
          </p>
        </div>
        <button className="rounded-md bg-[var(--color-ink)] text-white text-sm px-4 py-2 hover:bg-[var(--color-brass-dark)] transition-colors">
          Ajouter un propriétaire
        </button>
      </header>

      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-raised)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-paper)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Régime TVA</th>
              <th className="px-4 py-3">Logements</th>
              <th className="px-4 py-3">Paiement</th>
              <th className="px-4 py-3">Contact</th>
            </tr>
          </thead>
          <tbody>
            {owners.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-ink-soft)]">
                  Aucun propriétaire pour le moment. Ajoutez le premier pour commencer.
                </td>
              </tr>
            ) : (
              owners.map((owner) => (
                <tr key={owner.id} className="border-t border-[var(--color-line)]">
                  <td className="px-4 py-3 font-medium">
                    {owner.firstName} {owner.lastName}
                    {owner.companyName ? (
                      <span className="block text-xs text-[var(--color-ink-soft)]">{owner.companyName}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{owner.vatRegime}</td>
                  <td className="px-4 py-3">{owner.properties.length}</td>
                  <td className="px-4 py-3">{owner.paymentMethod}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">{owner.email ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
