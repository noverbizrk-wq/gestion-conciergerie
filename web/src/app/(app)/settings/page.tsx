import { getCurrentUserMembership } from "@/lib/auth-guard";
import { getCompanySettingsAction } from "@/modules/settings/actions";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const membership = await getCurrentUserMembership();
  if (!membership) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--color-line)] p-8 text-sm text-[var(--color-ink-soft)]">
        Votre compte n&apos;est rattaché à aucune société pour le moment.
      </div>
    );
  }

  const company = await getCompanySettingsAction(membership.companyId);

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--color-ink)]">
          Paramètres & Services
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-1">
          Identité de la société, coordonnées bancaires et tarifs par défaut.
        </p>
      </header>

      {membership.role !== "ADMIN" ? (
        <p className="text-xs text-[var(--color-warning)] mb-4">
          Seul un administrateur peut modifier ces paramètres. Vous pouvez les consulter en lecture seule.
        </p>
      ) : null}

      <SettingsForm
        companyId={membership.companyId}
        company={{
          name: company.name,
          siret: company.siret,
          tvaIntracom: company.tvaIntracom,
          address: company.address,
          iban: company.iban,
          brandColor: company.brandColor,
          defaultVatRate: Number(company.defaultVatRate),
          defaultVatRegime: company.defaultVatRegime,
        }}
      />
    </div>
  );
}
