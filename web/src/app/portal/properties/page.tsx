import { getPortalPropertiesAction } from "@/modules/portal/actions";

export default async function PortalPropertiesPage() {
  const properties = await getPortalPropertiesAction();

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-ink)] mb-6">
        Mes logements
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {properties.map((property) => (
          <div key={property.id} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-[var(--color-ink)]">{property.name}</h2>
              <span className="rounded-full bg-[var(--color-ink)]/5 text-[var(--color-ink-soft)] px-2.5 py-1 text-xs">
                {property.type}
              </span>
            </div>
            <p className="text-sm text-[var(--color-ink-soft)] mt-1">
              {property.address}, {property.postalCode} {property.city}
            </p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-2">
              Commission : {property.commissionRate ? `${property.commissionRate}%` : "—"}
            </p>
          </div>
        ))}
        {properties.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-soft)]">Aucun logement rattaché à votre compte.</p>
        ) : null}
      </div>
    </div>
  );
}
