import { listPropertiesAction } from "@/modules/properties/actions";

const DEMO_COMPANY_ID = process.env.DEMO_COMPANY_ID ?? "";

const TYPE_LABELS: Record<string, string> = {
  STUDIO: "Studio",
  T2: "T2",
  T3: "T3",
  T4_PLUS: "T4+",
  MAISON: "Maison",
  APPARTEMENT: "Appartement",
};

export default async function PropertiesPage() {
  const properties = DEMO_COMPANY_ID ? await listPropertiesAction(DEMO_COMPANY_ID) : [];

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-ink)]">
            Logements
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            {properties.length} logement{properties.length > 1 ? "s" : ""} géré{properties.length > 1 ? "s" : ""}
          </p>
        </div>
        <button className="rounded-md bg-[var(--color-ink)] text-white text-sm px-4 py-2 hover:bg-[var(--color-brass-dark)] transition-colors">
          Ajouter un logement
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-soft)] col-span-full">
            Aucun logement pour le moment.
          </p>
        ) : (
          properties.map((property) => (
            <div
              key={property.id}
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{property.name}</h3>
                <span className="text-xs rounded-full bg-[var(--color-paper)] px-2 py-0.5 text-[var(--color-ink-soft)]">
                  {TYPE_LABELS[property.type] ?? property.type}
                </span>
              </div>
              <p className="text-xs text-[var(--color-ink-soft)] mt-1">
                {property.address}, {property.postalCode} {property.city}
              </p>
              <p className="text-xs text-[var(--color-ink-soft)] mt-1">
                Propriétaire : {property.owner.firstName} {property.owner.lastName}
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="rounded-full bg-[var(--color-brass)]/15 text-[var(--color-brass-dark)] px-2 py-0.5">
                  {property.commissionMode === "FIXED_PERCENT"
                    ? `Commission ${property.commissionRate ?? "—"}%`
                    : "Commission variable"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
