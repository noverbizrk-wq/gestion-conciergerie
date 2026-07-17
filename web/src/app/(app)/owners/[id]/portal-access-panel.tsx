"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteOwnerToPortalAction, resetOwnerPortalPasswordAction } from "@/modules/owners/actions";

export function PortalAccessPanel({
  ownerId,
  companyId,
  hasAccess,
  email,
}: {
  ownerId: string;
  companyId: string;
  hasAccess: boolean;
  email: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; tempPassword: string | null } | null>(null);
  const router = useRouter();

  const runAction = (action: () => Promise<{ email: string; tempPassword: string | null }>) => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        setCredentials(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      }
    });
  };

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)] mb-3">
        Portail propriétaire
      </h2>

      {credentials ? (
        <div className="space-y-3">
          <div className="rounded-lg bg-[var(--color-paper)] p-3 text-xs space-y-1">
            <p className="text-[var(--color-ink-soft)]">Identifiants à transmettre au propriétaire :</p>
            <p className="font-mono">{credentials.email}</p>
            {credentials.tempPassword ? (
              <p className="font-mono">{credentials.tempPassword}</p>
            ) : (
              <p className="text-[var(--color-ink-soft)]">(compte existant réutilisé, mot de passe inchangé)</p>
            )}
            <p className="text-[var(--color-ink-soft)] pt-1">Note ce mot de passe : il ne sera plus affiché ensuite.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCredentials(null);
              router.refresh();
            }}
            className="rounded-lg border border-[var(--color-line)] text-sm px-4 py-2 hover:bg-[var(--color-paper)] transition-colors"
          >
            J&apos;ai noté le mot de passe
          </button>
        </div>
      ) : hasAccess ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-success)]">Accès au portail actif.</p>
          {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
          <button
            type="button"
            disabled={isPending}
            onClick={() => runAction(() => resetOwnerPortalPasswordAction(ownerId, companyId))}
            className="rounded-lg border border-[var(--color-line)] text-sm px-4 py-2 hover:bg-[var(--color-paper)] transition-colors disabled:opacity-50"
          >
            {isPending ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-[var(--color-ink-soft)] mb-3">
            {email
              ? "Donne accès à ce propriétaire à un espace en lecture seule (logements, réservations, factures)."
              : "Un email doit être renseigné pour activer l'accès portail."}
          </p>
          {error ? <p className="text-xs text-[var(--color-danger)] mb-2">{error}</p> : null}
          <button
            type="button"
            disabled={isPending || !email}
            onClick={() => runAction(() => inviteOwnerToPortalAction(ownerId, companyId))}
            className="rounded-lg bg-[var(--color-ink)] text-white text-sm px-4 py-2 hover:bg-[var(--color-brass-dark)] transition-colors disabled:opacity-50"
          >
            {isPending ? "Activation..." : "Activer l'accès portail"}
          </button>
        </>
      )}
    </div>
  );
}
