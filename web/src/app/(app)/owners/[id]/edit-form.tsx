"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOwnerAction, deleteOwnerAction } from "@/modules/owners/actions";

const VAT_REGIME_LABELS: Record<string, string> = {
  INHERIT_COMPANY: "Hérite de la société",
  REEL: "Régime réel",
  FRANCHISE: "Franchise en base",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  VIREMENT: "Virement",
  CB: "Carte bancaire",
  ESPECES: "Espèces",
  STRIPE: "Stripe",
  GOCARDLESS: "GoCardless",
};

type Owner = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  vatRegime: string;
  paymentMethod: string;
  iban: string | null;
};

export function OwnerEditForm({ companyId, owner }: { companyId: string; owner: Owner }) {
  const [form, setForm] = useState(owner);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function field<K extends keyof Owner>(key: K) {
    return {
      value: form[key] ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setSaved(false);
        setForm((prev) => ({ ...prev, [key]: e.target.value }));
      },
    };
  }

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6 space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Prénom">
          <input {...field("firstName")} className="input" />
        </FormField>
        <FormField label="Nom">
          <input {...field("lastName")} className="input" />
        </FormField>
        <FormField label="Email">
          <input type="email" {...field("email")} className="input" />
        </FormField>
        <FormField label="Téléphone">
          <input {...field("phone")} className="input" />
        </FormField>
        <FormField label="Adresse" full>
          <input {...field("address")} className="input" />
        </FormField>
        <FormField label="Régime de TVA">
          <select {...field("vatRegime")} className="input">
            {Object.entries(VAT_REGIME_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Moyen de paiement">
          <select {...field("paymentMethod")} className="input">
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="IBAN" full>
          <input {...field("iban")} className="input" />
        </FormField>
      </div>

      {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
      {saved ? <p className="text-xs text-[var(--color-success)]">Enregistré.</p> : null}

      <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-4">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (!confirm(`Supprimer ${owner.firstName} ${owner.lastName} ? Cette action est irréversible.`)) return;
            startTransition(async () => {
              try {
                await deleteOwnerAction(owner.id, companyId);
                router.push("/owners");
              } catch (e) {
                setError(e instanceof Error ? e.message : "Erreur lors de la suppression");
              }
            });
          }}
          className="text-sm text-[var(--color-danger)] hover:underline disabled:opacity-50"
        >
          Supprimer ce propriétaire
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                await updateOwnerAction({
                  id: owner.id,
                  companyId,
                  firstName: form.firstName,
                  lastName: form.lastName,
                  email: form.email || undefined,
                  phone: form.phone || undefined,
                  address: form.address || undefined,
                  vatRegime: form.vatRegime,
                  paymentMethod: form.paymentMethod,
                  iban: form.iban || undefined,
                });
                setSaved(true);
                router.refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement");
              }
            });
          }}
          className="rounded-md bg-[var(--color-ink)] text-white text-sm px-5 py-2.5 hover:bg-[var(--color-ink)]/90 transition-colors disabled:opacity-50"
        >
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid var(--color-line);
          background: white;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}

function FormField({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`space-y-1 ${full ? "md:col-span-2" : ""}`}>
      <label className="text-xs font-medium text-[var(--color-ink-soft)]">{label}</label>
      {children}
    </div>
  );
}
