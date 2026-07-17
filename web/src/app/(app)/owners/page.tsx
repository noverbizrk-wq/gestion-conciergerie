import Link from "next/link";
import { listOwnersAction } from "@/modules/owners/actions";
import { getCurrentUserMembership } from "@/lib/auth-guard";
import { OwnersToolbar } from "./owners-toolbar";

export default async function OwnersPage() {
  const membership = await getCurrentUserMembership();
  const owners = membership ? await listOwnersAction(membership.companyId) : [];

  return (
    <div>
      <OwnersToolbar companyId={membership?.companyId ?? ""} count={owners.length} />

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
                    <Link href={`/owners/${owner.id}`} className="hover:text-[var(--color-brass-dark)] hover:underline">
                      {owner.firstName} {owner.lastName}
                    </Link>
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
