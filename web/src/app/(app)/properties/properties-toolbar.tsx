"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPropertyAction } from "@/modules/properties/actions";

type Owner = { id: string; firstName: string; lastName: string };

const TYPE_LABELS: Record<string, string> = {
  STUDIO: "Studio",
  T2: "T2",
  T3: "T3",
  T4_PLUS: "T4+",
  MAISON: "Maison",
  APPARTEMENT: "Appartement",
};

export function PropertiesToolbar({
  companyId,
  count,
  owners,
}: {
  companyId: string;
  count: number;
  owners: Owner[];
}) {
  const [open, setOpen] = useState(false);
  const [ownerId, setOwnerId] = useState(owners[0]?.id ?? "");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [type, setType] = useState("STUDIO");
  const [commissionRate, setCommissionRate] = useState(15);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--color-ink)]">Logements</h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            {count} logement{count > 1 ? "s" : ""} géré{count > 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={owners.length === 0}
          className="rounded-lg bg-[var(--color-ink)] text-white text-sm px-4 py-2 hover:bg-[var(--color-brass-dark)] transition-colors disabled:opacity-50"
        >
          {open ? "Fermer" : "Ajouter un logement"}
        </button>
      </div>

      {owners.length === 0 ? (
        <p className="text-xs text-[var(--color-ink-soft)] mt-2">
          Ajoutez d&apos;abord un propriétaire avant de créer un logement.
        </p>
      ) : null}

      {open ? (
        <div className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
            >
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.firstName} {o.lastName}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Nom du logement"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              placeholder="Adresse"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20 md:col-span-2"
            />
            <input
              type="text"
              placeholder="Code postal"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
            />
            <input
              type="text"
              placeholder="Ville"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
            />
            <input
              type="number"
              min={0}
              max={100}
              step="0.5"
              placeholder="Commission %"
              value={commissionRate}
              onChange={(e) => setCommissionRate(Number(e.target.value))}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
            />
          </div>
          {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isPending || !name || !address || !city || !postalCode || !ownerId}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  try {
                    await createPropertyAction({
                      companyId,
                      ownerId,
                      name,
                      address,
                      city,
                      postalCode,
                      type,
                      commissionMode: "FIXED_PERCENT",
                      commissionRate,
                      cleaningBilledTo: "OWNER",
                    });
                    setName("");
                    setAddress("");
                    setCity("");
                    setPostalCode("");
                    setOpen(false);
                    router.refresh();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Erreur lors de la création");
                  }
                });
              }}
              className="rounded-lg bg-[var(--color-ink)] text-white text-sm font-medium px-4 py-2 shadow-sm hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isPending ? "Création..." : "Créer le logement"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
