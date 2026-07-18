import { getCurrentUserMembership } from "@/lib/auth-guard";
import { listMembersAction } from "@/modules/team/actions";
import { InviteForm } from "./invite-form";
import { MemberRow } from "./member-row";

const TEAM_VIEW_ROLES = ["ADMIN", "SUPER_ADMIN", "OPERATIONAL_MANAGER", "ACCOUNTANT", "EMPLOYEE", "READONLY"];

export default async function TeamPage() {
  const membership = await getCurrentUserMembership();
  if (!membership) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--color-line)] p-8 text-sm text-[var(--color-ink-soft)]">
        Votre compte n&apos;est rattaché à aucune société pour le moment.
      </div>
    );
  }

  // La page Équipe n'est pas ouverte au rôle AGENT (intervenant terrain) :
  // listMembersAction refuse l'accès côté serveur. On affiche un message
  // clair plutôt que de laisser l'action lever une UnauthorizedError non
  // gérée (page en erreur).
  if (!TEAM_VIEW_ROLES.includes(membership.role)) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--color-line)] p-8 text-sm text-[var(--color-ink-soft)]">
        Cette page n&apos;est pas accessible à votre rôle.
      </div>
    );
  }

  const members = await listMembersAction(membership.companyId);
  const canManage = membership.role === "ADMIN";

  return (
    <div>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--color-ink)]">
            Équipe
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            {members.length} membre{members.length > 1 ? "s" : ""} de {membership.company.name}
          </p>
        </div>
        {canManage ? <InviteForm companyId={membership.companyId} /> : null}
      </header>

      {!canManage ? (
        <p className="text-xs text-[var(--color-warning)] mb-4">
          Seul un administrateur peut inviter, modifier les rôles ou retirer des membres.
        </p>
      ) : null}

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-paper)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] border-b border-[var(--color-line)]">
            <tr>
              <th className="px-5 py-3.5">Membre</th>
              <th className="px-5 py-3.5">Rôle</th>
              <th className="px-5 py-3.5">Depuis</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <MemberRow
                key={member.id}
                membershipId={member.id}
                companyId={membership.companyId}
                name={member.user.name ?? "—"}
                email={member.user.email}
                role={member.role}
                joinedAt={member.createdAt.toLocaleDateString("fr-FR")}
                isCurrentUser={member.userId === membership.userId}
                canManage={canManage}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
