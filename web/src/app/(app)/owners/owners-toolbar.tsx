"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOwnerAction } from "@/modules/owners/actions";

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

export function OwnersToolbar({ companyId, count }: { companyId: string; count: number }) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [vatRegime, setVatRegime] = useState("INHERIT_COMPANY");
  const [paymentMethod, setPaymentMethod] = useState("VIREMENT");
  const [iban, setIban] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-ink)]">
            Propriétaires
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            {count} propriétaire{count > 1 ? "s" : ""} enregistré{count > 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={!companyId}
          className="rounded-md bg-[var(--color-ink)] text-white text-sm px-4 py-2 hover:bg-[var(--color-brass-dark)] transition-colors disabled:opacity-50"
        >
          {open ? "Fermer" : "Ajouter un propriétaire"}
        </button>
      </div>

      {open ? (
        <div className="mt-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Nom"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
            />
            <input
              type="tel"
              placeholder="Téléphone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Adresse"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm md:col-span-2"
            />
            <select
              value={vatRegime}
              onChange={(e) => setVatRegime(e.target.value)}
              className="rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
            >
              {Object.entries(VAT_REGIME_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="IBAN (optionnel)"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              className="rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm md:col-span-2"
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
                    await createOwnerAction({
                      companyId,
                      firstName,
                      lastName,
                      email: email || undefined,
                      phone: phone || undefined,
                      address: address || undefined,
                      vatRegime,
                      paymentMethod,
                      iban: iban || undefined,
                    });
                    setFirstName("");
                    setLastName("");
                    setEmail("");
                    setPhone("");
                    setAddress("");
                    setIban("");
                    setOpen(false);
                    router.refresh();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Erreur lors de la création");
                  }
                });
              }}
              className="rounded-md bg-[var(--color-ink)] text-white text-sm px-4 py-2 hover:bg-[var(--color-ink)]/90 transition-colors disabled:opacity-50"
            >
              {isPending ? "Création..." : "Créer le propriétaire"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
