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
  UserCheck,
  ClipboardCheck,
  AlertTriangle,
  ListChecks,
} from "lucide-react";

type Role = "ADMIN" | "ACCOUNTANT" | "EMPLOYEE" | "READONLY" | "SUPER_ADMIN" | "OPERATIONAL_MANAGER" | "AGENT";

const MANAGEMENT_ROLES: Role[] = ["ADMIN", "SUPER_ADMIN", "OPERATIONAL_MANAGER", "ACCOUNTANT", "EMPLOYEE", "READONLY"];

// Sous-ensemble sans EMPLOYEE : équipe et paramètres société exposent des
// informations sensibles (rôles des membres, IBAN, SIRET...) qui ne doivent
// pas être visibles par un simple compte "Employé".
const MANAGEMENT_ROLES_SENSITIVE: Role[] = ["ADMIN", "SUPER_ADMIN", "OPERATIONAL_MANAGER", "ACCOUNTANT", "READONLY"];

// Chaque entrée déclare les rôles autorisés à la voir dans le menu. Un AGENT
// (intervenant terrain) n'a accès qu'à son propre espace ("Mes missions") et
// au signalement/consultation d'incidents ; le reste du back-office (finance,
// propriétaires, équipe...) ne lui est pas ouvert côté server actions, donc on
// ne l'affiche pas non plus dans le menu pour éviter des pages qui échouent.
const NAV_ITEMS: { href: string; label: string; icon: typeof LayoutDashboard; roles: Role[] }[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, roles: MANAGEMENT_ROLES },
  { href: "/planning", label: "Planning", icon: CalendarDays, roles: MANAGEMENT_ROLES },
  { href: "/missions", label: "Missions", icon: ClipboardCheck, roles: MANAGEMENT_ROLES },
  { href: "/my-missions", label: "Mes missions", icon: ListChecks, roles: [...MANAGEMENT_ROLES, "AGENT"] },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle, roles: [...MANAGEMENT_ROLES, "AGENT"] },
  { href: "/owners", label: "Propriétaires", icon: Users, roles: MANAGEMENT_ROLES },
  { href: "/properties", label: "Logements", icon: Home, roles: MANAGEMENT_ROLES },
  { href: "/employees", label: "Intervenants", icon: UserCheck, roles: MANAGEMENT_ROLES },
  { href: "/bookings", label: "Réservations", icon: Upload, roles: MANAGEMENT_ROLES },
  { href: "/quotes", label: "Devis", icon: FileSignature, roles: MANAGEMENT_ROLES },
  { href: "/invoices", label: "Factures", icon: FileText, roles: MANAGEMENT_ROLES },
  { href: "/payments", label: "Encaissements", icon: Wallet, roles: MANAGEMENT_ROLES },
  { href: "/reviews", label: "Avis clients", icon: Star, roles: MANAGEMENT_ROLES },
  { href: "/hour-packages", label: "Packs d'heures", icon: Clock, roles: MANAGEMENT_ROLES },
  { href: "/assistant", label: "Assistant IA", icon: Sparkles, roles: MANAGEMENT_ROLES },
  { href: "/team", label: "Équipe", icon: UsersRound, roles: MANAGEMENT_ROLES_SENSITIVE },
  { href: "/settings", label: "Paramètres & Services", icon: Settings, roles: MANAGEMENT_ROLES_SENSITIVE },
];

export function SidebarNav({ role }: { role: string | null }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !role || item.roles.includes(role as Role));

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
      {items.map(({ href, label, icon: Icon }) => {
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
