"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Home,
  FileText,
  FileSignature,
  Upload,
  Sparkles,
  CalendarDays,
  Wallet,
  Settings,
  Star,
  Clock,
  UsersRound,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/planning", label: "Planning", icon: CalendarDays },
  { href: "/owners", label: "Propriétaires", icon: Users },
  { href: "/properties", label: "Logements", icon: Home },
  { href: "/bookings", label: "Réservations", icon: Upload },
  { href: "/quotes", label: "Devis", icon: FileSignature },
  { href: "/invoices", label: "Factures", icon: FileText },
  { href: "/payments", label: "Encaissements", icon: Wallet },
  { href: "/reviews", label: "Avis clients", icon: Star },
  { href: "/hour-packages", label: "Packs d'heures", icon: Clock },
  { href: "/assistant", label: "Assistant IA", icon: Sparkles },
  { href: "/team", label: "Équipe", icon: UsersRound },
  { href: "/settings", label: "Paramètres & Services", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-[var(--color-brass)]/10 text-[var(--color-brass-dark)]"
                : "text-[var(--color-ink-soft)] hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]"
            }`}
          >
            <Icon
              size={16}
              strokeWidth={1.75}
              className={isActive ? "text-[var(--color-brass-dark)]" : "text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)]"}
            />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
