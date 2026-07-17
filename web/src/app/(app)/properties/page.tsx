import Link from "next/link";
import { listPropertiesAction } from "@/modules/properties/actions";
import { listOwnersAction } from "@/modules/owners/actions";
import { getCurrentUserMembership } from "@/lib/auth-guard";
import { PropertiesToolbar } from "./properties-toolbar";

const TYPE_LABELS: Record<string, string> = {
  STUDIO: "Studio",
  T2: "T2",
  T3: "T3",
  T4_PLUS: "T4+",
  MAISON: "Maison",
  APPARTEMENT: "Appartement",
};

export default async function PropertiesPage() {
  const membership = await getCurrentUserMembership();
  const [properties, owners] = membership
    ? await Promise.all([
        listPropertiesAction(membership.companyId),
        listOwnersAction(membership.companyId),
      ])
    : [[], []];

  return (
    <div>
      <PropertiesToolbar
        companyId={membership?.companyId ?? ""}
        count={properties.length}
        owners={owners.map((o) => ({ id: o.id, firstName: o.firstName, lastName: o.lastName }))}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-soft)] col-span-full">
            Aucun logement pour le moment.
          </p>
        ) : (
          properties.map((property) => (
            <Link
              key={property.id}
              href={`/properties/${property.id}`}
              className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-5 hover:border-[var(--color-brass)] transition-colors block"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{property.name}</h3>
                <span className="text-xs font-medium rounded-full bg-[var(--color-paper)] px-2.5 py-1 text-[var(--color-ink-soft)]">
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
                <span className="rounded-full bg-[var(--color-brass)]/15 text-[var(--color-brass-dark)] px-2.5 py-1 text-xs font-medium">
                  {property.commissionMode === "FIXED_PERCENT"
                    ? `Commission ${property.commissionRate ?? "—"}%`
                    : "Commission variable"}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
