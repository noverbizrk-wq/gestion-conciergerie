"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateEmployeeAction,
  deleteEmployeeAction,
  setEmployeeActiveAction,
} from "@/modules/employees/actions";

const TYPE_LABELS: Record<string, string> = {
  SALARIE: "Salarié",
  PRESTATAIRE: "Prestataire",
};

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  type: string;
  zone: string | null;
  skills: string[];
  hourlyRate: number | null;
  perMissionRate: number | null;
  notes: string | null;
  active: boolean;
};

export function EmployeeEditForm({ companyId, employee }: { companyId: string; employee: Employee }) {
  const [form, setForm] = useState({
    ...employee,
    skillsText: employee.skills.join(", "),
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function field<K extends keyof typeof form>(key: K) {
    return {
      value: (form[key] as string | number | null) ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setSaved(false);
        setForm((prev) => ({ ...prev, [key]: e.target.value }));
      },
    };
  }

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-6 space-y-4 max-w-2xl">
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
        <FormField label="Type">
          <select {...field("type")} className="input">
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Zone géographique">
          <input {...field("zone")} className="input" />
        </FormField>
        <FormField label="Compétences (séparées par des virgules)" full>
          <input {...field("skillsText")} className="input" />
        </FormField>
        <FormField label="Taux horaire (€)">
          <input type="number" step="0.01" {...field("hourlyRate")} className="input" />
        </FormField>
        <FormField label="Taux par mission (€)">
          <input type="number" step="0.01" {...field("perMissionRate")} className="input" />
        </FormField>
        <FormField label="Notes internes" full>
          <textarea {...field("notes")} rows={3} className="input" />
        </FormField>
      </div>

      {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
      {saved ? <p className="text-xs text-[var(--color-success)]">Enregistré.</p> : null}

      <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (
                !confirm(`Supprimer ${employee.firstName} ${employee.lastName} ? Cette action est irréversible.`)
              )
                return;
              startTransition(async () => {
                try {
                  await deleteEmployeeAction(employee.id, companyId);
                  router.push("/employees");
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Erreur lors de la suppression");
                }
              });
            }}
            className="text-sm text-[var(--color-danger)] hover:underline disabled:opacity-50"
          >
            Supprimer
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                try {
                  await setEmployeeActiveAction(employee.id, companyId, !form.active);
                  setForm((prev) => ({ ...prev, active: !prev.active }));
                  router.refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Erreur");
                }
              });
            }}
            className="text-sm text-[var(--color-ink-soft)] hover:underline disabled:opacity-50"
          >
            {form.active ? "Désactiver" : "Réactiver"}
          </button>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                await updateEmployeeAction({
                  id: employee.id,
                  companyId,
                  firstName: form.firstName,
                  lastName: form.lastName,
                  email: form.email || undefined,
                  phone: form.phone || undefined,
                  type: form.type,
                  zone: form.zone || undefined,
                  skills: form.skillsText
                    ? form.skillsText.split(",").map((s) => s.trim()).filter(Boolean)
                    : [],
                  hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
                  perMissionRate: form.perMissionRate ? Number(form.perMissionRate) : undefined,
                  notes: form.notes || undefined,
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
