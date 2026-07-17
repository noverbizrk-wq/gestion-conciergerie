"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEmployeeAction } from "@/modules/employees/actions";

const TYPE_LABELS: Record<string, string> = {
  SALARIE: "Salarié",
  PRESTATAIRE: "Prestataire",
};

export function EmployeesToolbar({ companyId, count }: { companyId: string; count: number }) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("SALARIE");
  const [zone, setZone] = useState("");
  const [skills, setSkills] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--color-ink)]">
            Intervenants
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            {count} intervenant{count > 1 ? "s" : ""} enregistré{count > 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={!companyId}
          className="rounded-lg bg-[var(--color-ink)] text-white text-sm px-4 py-2 hover:bg-[var(--color-brass-dark)] transition-colors disabled:opacity-50"
        >
          {open ? "Fermer" : "Ajouter un intervenant"}
        </button>
      </div>

      {open ? (
        <div className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
            />
            <input
              type="text"
              placeholder="Nom"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
            />
            <input
              type="tel"
              placeholder="Téléphone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
            >
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Zone géographique"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
            />
            <input
              type="text"
              placeholder="Compétences (séparées par des virgules)"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Taux horaire (€)"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
            />
          </div>
          {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isPending || !firstName || !lastName}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  try {
                    await createEmployeeAction({
                      companyId,
                      firstName,
                      lastName,
                      email: email || undefined,
                      phone: phone || undefined,
                      type,
                      zone: zone || undefined,
                      skills: skills
                        ? skills.split(",").map((s) => s.trim()).filter(Boolean)
                        : [],
                      hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
                    });
                    setFirstName("");
                    setLastName("");
                    setEmail("");
                    setPhone("");
                    setZone("");
                    setSkills("");
                    setHourlyRate("");
                    setOpen(false);
                    router.refresh();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Erreur lors de la création");
                  }
                });
              }}
              className="rounded-lg bg-[var(--color-ink)] text-white text-sm font-medium px-4 py-2 shadow-sm hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isPending ? "Création..." : "Créer l'intervenant"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
