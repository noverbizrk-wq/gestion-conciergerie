import Link from "next/link";
import { LayoutDashboard, Users, Home, FileText, Upload, Sparkles } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/owners", label: "Propriétaires", icon: Users },
  { href: "/properties", label: "Logements", icon: Home },
  { href: "/bookings", label: "Import réservations", icon: Upload },
  { href: "/invoices", label: "Factures", icon: FileText },
  { href: "/assistant", label: "Assistant IA", icon: Sparkles },
];

export function Sidebar() {
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
    </aside>
  );
}
