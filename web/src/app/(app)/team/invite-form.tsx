"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteMemberAction, type AppRole } from "@/modules/team/actions";

const ROLE_LABELS: Record<AppRole, string> = {
  ADMIN: "Administrateur",
  ACCOUNTANT: "Comptable",
  EMPLOYEE: "Employé",
  READONLY: "Lecture seule",
};

export function InviteForm({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AppRole>("EMPLOYEE");
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ email: string; tempPassword: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (successInfo) {
    return (
      <div className="rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-5 mb-6 space-y-2">
        <p className="text-sm font-medium text-[var(--color-success)]">Membre ajouté avec succès.</p>
        <p className="text-sm text-[var(--color-ink)]">
          Transmets ces identifiants temporaires à <strong>{successInfo.email}</strong> (visibles une seule fois) :
        </p>
        <p className="font-mono text-sm bg-[var(--color-paper-raised)] border border-[var(--color-line)] rounded-lg px-3 py-2 inline-block">
          {successInfo.email} / {successInfo.tempPassword}
        </p>
        <div>
          <button
            type="button"
            onClick={() => setSuccessInfo(null)}
            className="text-xs text-[var(--color-brass-dark)] hover:underline"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[var(--color-brass)] text-white text-sm font-medium px-4 py-2 shadow-sm hover:bg-[var(--color-brass-dark)] transition-all active:scale-[0.98]"
      >
        Inviter un membre
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5 mb-6 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as AppRole)}
          className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
        >
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isPending || !email}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                const result = await inviteMemberAction({ companyId, email, name, role });
                if (result.tempPassword) {
                  setSuccessInfo({ email, tempPassword: result.tempPassword });
                }
                setEmail("");
                setName("");
                setOpen(false);
                router.refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Erreur lors de l'invitation");
              }
            });
          }}
          className="rounded-lg bg-[var(--color-ink)] text-white text-sm font-medium px-4 py-2 shadow-sm hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isPending ? "Invitation..." : "Inviter"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
