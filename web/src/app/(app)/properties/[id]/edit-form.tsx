"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePropertyAction, deletePropertyAction } from "@/modules/properties/actions";

const TYPE_LABELS: Record<string, string> = {
  STUDIO: "Studio",
  T2: "T2",
  T3: "T3",
  T4_PLUS: "T4+",
  MAISON: "Maison",
  APPARTEMENT: "Appartement",
};

const BILLED_TO_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  GUEST: "Voyageur",
};

type Property = {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  type: string;
  commissionRate: number | null;
  cleaningBilledTo: string;
  cleaningFlatRate: number | null;
};

export function PropertyEditForm({ companyId, property }: { companyId: string; property: Property }) {
  const [form, setForm] = useState(property);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function field<K extends keyof Property>(key: K) {
    return {
      value: (form[key] as string | number) ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setSaved(false);
        setForm((prev) => ({ ...prev, [key]: e.target.value }));
      },
    };
  }

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-6 space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Nom du logement">
          <input {...field("name")} className="input" />
        </FormField>
        <FormField label="Type">
          <select {...field("type")} className="input">
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Adresse" full>
          <input {...field("address")} className="input" />
        </FormField>
        <FormField label="Code postal">
          <input {...field("postalCode")} className="input" />
        </FormField>
        <FormField label="Ville">
          <input {...field("city")} className="input" />
        </FormField>
        <FormField label="Commission (%)">
          <input
            type="number"
            min={0}
            max={100}
            step="0.5"
            value={form.commissionRate ?? ""}
            onChange={(e) => setForm((prev) => ({ ...prev, commissionRate: Number(e.target.value) }))}
            className="input"
          />
        </FormField>
        <FormField label="Ménage facturé à">
          <select {...field("cleaningBilledTo")} className="input">
            {Object.entries(BILLED_TO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Forfait ménage (€)">
          <input
            type="number"
            min={0}
            step="1"
            value={form.cleaningFlatRate ?? ""}
            onChange={(e) => setForm((prev) => ({ ...prev, cleaningFlatRate: Number(e.target.value) }))}
            className="input"
          />
        </FormField>
      </div>

      {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
      {saved ? <p className="text-xs text-[var(--color-success)]">Enregistré.</p> : null}

      <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-4">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (!confirm(`Supprimer le logement "${property.name}" ? Cette action est irréversible.`)) return;
            startTransition(async () => {
              try {
                await deletePropertyAction(property.id, companyId);
                router.push("/properties");
              } catch (e) {
                setError(e instanceof Error ? e.message : "Erreur lors de la suppression");
              }
            });
          }}
          className="text-sm text-[var(--color-danger)] hover:underline disabled:opacity-50"
        >
          Supprimer ce logement
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                await updatePropertyAction({
                  id: property.id,
                  companyId,
                  data: {
                    name: form.name,
                    address: form.address,
                    city: form.city,
                    postalCode: form.postalCode,
                    type: form.type,
                    commissionRate: form.commissionRate ?? undefined,
                    cleaningBilledTo: form.cleaningBilledTo,
                    cleaningFlatRate: form.cleaningFlatRate ?? undefined,
                  },
                });
                setSaved(true);
                router.refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement");
              }
            });
          }}
          className="rounded-lg bg-[var(--color-ink)] text-white text-sm px-5 py-2.5 hover:bg-[var(--color-ink)]/90 transition-colors disabled:opacity-50"
        >
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--color-line);
          background: white;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .input:focus {
          outline: none;
          border-color: var(--color-brass);
          box-shadow: 0 0 0 3px rgb(99 102 241 / 0.2);
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
