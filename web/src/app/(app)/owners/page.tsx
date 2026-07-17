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

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-paper)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] border-b border-[var(--color-line)]">
            <tr>
              <th className="px-5 py-3.5">Nom</th>
              <th className="px-5 py-3.5">Régime TVA</th>
              <th className="px-5 py-3.5">Logements</th>
              <th className="px-5 py-3.5">Paiement</th>
              <th className="px-5 py-3.5">Contact</th>
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
                <tr key={owner.id} className="border-t border-[var(--color-line)] transition-colors hover:bg-[var(--color-paper)]">
                  <td className="px-5 py-3.5 font-medium">
                    <Link href={`/owners/${owner.id}`} className="hover:text-[var(--color-brass-dark)] hover:underline">
                      {owner.firstName} {owner.lastName}
                    </Link>
                    {owner.companyName ? (
                      <span className="block text-xs text-[var(--color-ink-soft)]">{owner.companyName}</span>
                    ) : null}
                  </td>
                  <td className="px-5 py-3.5">{owner.vatRegime}</td>
                  <td className="px-5 py-3.5">{owner.properties.length}</td>
                  <td className="px-5 py-3.5">{owner.paymentMethod}</td>
                  <td className="px-5 py-3.5 text-[var(--color-ink-soft)]">{owner.email ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
