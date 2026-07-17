import Link from "next/link";
import { LayoutDashboard, Users, Home, FileText, FileSignature, Upload, Sparkles, CalendarDays, Wallet, Settings } from "lucide-react";
import { getCurrentUserMembership } from "@/lib/auth-guard";
import { SignOutButton } from "@/components/sign-out-button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/planning", label: "Planning", icon: CalendarDays },
  { href: "/owners", label: "Propriétaires", icon: Users },
  { href: "/properties", label: "Logements", icon: Home },
  { href: "/bookings", label: "Réservations", icon: Upload },
  { href: "/quotes", label: "Devis", icon: FileSignature },
  { href: "/invoices", label: "Factures", icon: FileText },
  { href: "/payments", label: "Encaissements", icon: Wallet },
  { href: "/assistant", label: "Assistant IA", icon: Sparkles },
  { href: "/settings", label: "Paramètres & Services", icon: Settings },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  ACCOUNTANT: "Comptable",
  EMPLOYEE: "Employé",
  READONLY: "Lecture seule",
};

export async function Sidebar() {
  const membership = await getCurrentUserMembership();

  return (
    <aside className="w-64 shrink-0 border-r border-[var(--color-line)] bg-[var(--color-paper-raised)] flex flex-col">
      <div className="px-6 py-6 border-b border-[var(--color-line)]">
        <p className="font-[family-name:var(--font-display)] italic text-xl text-[var(--color-ink)]">
          Nover<span className="text-[var(--color-brass)] not-italic"> Invoice</span>
        </p>
        <p className="text-xs text-[var(--color-ink-soft)] mt-1">Conciergerie & facturation</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)] transition-colors"
          >
            <Icon size={16} strokeWidth={1.75} />
            {label}
          </Link>
        ))}
      </nav>
      {membership ? (
        <div className="px-6 py-4 border-t border-[var(--color-line)]">
          <p className="text-sm font-medium text-[var(--color-ink)]">{membership.user?.name ?? membership.user?.email}</p>
          <p className="text-xs text-[var(--color-ink-soft)] mb-2">
            {ROLE_LABELS[membership.role] ?? membership.role} · {membership.company.name}
          </p>
          <SignOutButton />
        </div>
      ) : null}
    </aside>
  );
}
