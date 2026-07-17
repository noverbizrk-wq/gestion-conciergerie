"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMemberRoleAction, removeMemberAction, type AppRole } from "@/modules/team/actions";

const ROLE_LABELS: Record<AppRole, string> = {
  ADMIN: "Administrateur",
  ACCOUNTANT: "Comptable",
  EMPLOYEE: "Employé",
  READONLY: "Lecture seule",
};

export function MemberRow({
  membershipId,
  companyId,
  name,
  email,
  role,
  joinedAt,
  isCurrentUser,
  canManage,
}: {
  membershipId: string;
  companyId: string;
  name: string;
  email: string;
  role: AppRole;
  joinedAt: string;
  isCurrentUser: boolean;
  canManage: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <tr className="border-t border-[var(--color-line)] transition-colors hover:bg-[var(--color-paper)]">
      <td className="px-5 py-3.5 font-medium">
        {name}
        {isCurrentUser ? <span className="ml-2 text-xs text-[var(--color-ink-soft)]">(toi)</span> : null}
        <span className="block text-xs text-[var(--color-ink-soft)]">{email}</span>
      </td>
      <td className="px-5 py-3.5">
        {canManage ? (
          <select
            value={role}
            disabled={isPending}
            onChange={(e) => {
              setError(null);
              const nextRole = e.target.value as AppRole;
              startTransition(async () => {
                try {
                  await updateMemberRoleAction(membershipId, companyId, nextRole);
                  router.refresh();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Erreur");
                }
              });
            }}
            className="rounded-lg border border-[var(--color-line)] bg-white px-2 py-1 text-xs transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
          >
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-[var(--color-ink-soft)]">{ROLE_LABELS[role]}</span>
        )}
      </td>
      <td className="px-5 py-3.5 text-[var(--color-ink-soft)]">{joinedAt}</td>
      <td className="px-5 py-3.5 text-right">
        {canManage && !isCurrentUser ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (!confirm(`Retirer ${name || email} de l'équipe ?`)) return;
              setError(null);
              startTransition(async () => {
                try {
                  await removeMemberAction(membershipId, companyId);
                  router.refresh();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Erreur");
                }
              });
            }}
            className="text-xs text-[var(--color-danger)] hover:underline disabled:opacity-50"
          >
            Retirer
          </button>
        ) : null}
        {error ? <p className="text-[10px] text-[var(--color-danger)] mt-1">{error}</p> : null}
      </td>
    </tr>
  );
}
