"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCompanySettingsAction } from "@/modules/settings/actions";

type Company = {
  name: string;
  siret: string | null;
  tvaIntracom: string | null;
  address: string | null;
  iban: string | null;
  brandColor: string;
  defaultVatRate: number;
  defaultVatRegime: "REEL" | "FRANCHISE" | "INHERIT_COMPANY";
};

const VAT_REGIME_LABELS: Record<Company["defaultVatRegime"], string> = {
  REEL: "Régime réel (TVA collectée)",
  FRANCHISE: "Franchise en base (pas de TVA)",
  INHERIT_COMPANY: "Hérite de la société",
};

export function SettingsForm({ companyId, company }: { companyId: string; company: Company }) {
  const [form, setForm] = useState(company);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function field<K extends keyof Company>(key: K) {
    return {
      value: form[key] ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setSaved(false);
        setForm((prev) => ({ ...prev, [key]: e.target.value }));
      },
    };
  }

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-6 space-y-6 max-w-2xl">
      <section>
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)] mb-4">Identité</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nom de la société">
            <input {...field("name")} className="input" />
          </FormField>
          <FormField label="SIRET">
            <input {...field("siret")} className="input" />
          </FormField>
          <FormField label="N° TVA intracommunautaire">
            <input {...field("tvaIntracom")} className="input" />
          </FormField>
          <FormField label="Couleur de marque">
            <input type="color" {...field("brandColor")} className="h-10 w-full rounded-lg border border-[var(--color-line)]" />
          </FormField>
          <FormField label="Adresse" full>
            <input {...field("address")} className="input" />
          </FormField>
        </div>
      </section>

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)] mb-4">
          Coordonnées bancaires
        </h2>
        <FormField label="IBAN">
          <input {...field("iban")} className="input" />
        </FormField>
      </section>

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)] mb-4">
          Tarifs et TVA par défaut
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Taux de TVA par défaut (%)">
            <input
              type="number"
              step="0.1"
              value={form.defaultVatRate}
              onChange={(e) => setForm((prev) => ({ ...prev, defaultVatRate: Number(e.target.value) }))}
              className="input"
            />
          </FormField>
          <FormField label="Régime de TVA par défaut">
            <select
              value={form.defaultVatRegime}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, defaultVatRegime: e.target.value as Company["defaultVatRegime"] }))
              }
              className="input"
            >
              {(Object.keys(VAT_REGIME_LABELS) as Company["defaultVatRegime"][]).map((regime) => (
                <option key={regime} value={regime}>
                  {VAT_REGIME_LABELS[regime]}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </section>

      <div className="flex items-center gap-3 border-t border-[var(--color-line)] pt-4">
        {saved ? <p className="text-xs text-[var(--color-success)]">Enregistré.</p> : null}
        {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                await updateCompanySettingsAction(companyId, {
                  name: form.name,
                  siret: form.siret ?? undefined,
                  tvaIntracom: form.tvaIntracom ?? undefined,
                  address: form.address ?? undefined,
                  iban: form.iban ?? undefined,
                  brandColor: form.brandColor,
                  defaultVatRate: form.defaultVatRate,
                  defaultVatRegime: form.defaultVatRegime,
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
