import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalOwnerAction } from "@/modules/portal/actions";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_ITEMS = [
  { href: "/portal", label: "Vue d'ensemble" },
  { href: "/portal/properties", label: "Mes logements" },
  { href: "/portal/bookings", label: "Réservations" },
  { href: "/portal/invoices", label: "Factures & relevés" },
  { href: "/portal/incidents", label: "Incidents" },
];

/**
 * Layout dédié au portail propriétaire — volontairement distinct de la sidebar
 * back-office (aucun accès aux modules d'administration). Un propriétaire sans
 * compte lié (Owner.userId) est redirigé vers /login.
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const owner = await getPortalOwnerAction().catch(() => null);
  // "/" est le dispatcher : un compte staff sans accès portail y sera renvoyé vers
  // /dashboard, un visiteur non connecté vers /login (via le middleware).
  if (!owner) redirect("/");

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <header className="border-b border-[var(--color-line)] bg-[var(--color-paper-raised)]">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)]">
              Portail propriétaire
            </p>
            <p className="text-xs text-[var(--color-ink-soft)]">{owner.company.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="text-right">
              <p className="text-sm text-[var(--color-ink)]">
                {owner.firstName} {owner.lastName}
              </p>
              <SignOutButton />
            </div>
          </div>
        </div>
        <nav className="mx-auto max-w-5xl px-6 flex gap-1 -mb-px">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] border-b-2 border-transparent hover:border-[var(--color-brass)] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
