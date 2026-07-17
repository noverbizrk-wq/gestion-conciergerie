import Link from "next/link";
import { getCurrentUserMembership } from "@/lib/auth-guard";
import { SignOutButton } from "@/components/sign-out-button";
import { SidebarNav } from "@/components/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  ACCOUNTANT: "Comptable",
  EMPLOYEE: "Employé",
  READONLY: "Lecture seule",
};

export async function Sidebar() {
  const membership = await getCurrentUserMembership();

  return (
    <aside className="w-64 shrink-0 border-r border-[var(--color-line)] bg-[var(--color-paper-raised)] flex flex-col h-screen sticky top-0">
      <div className="flex items-center justify-between px-5 py-5 border-b border-[var(--color-line)]">
        <Link href="/dashboard" className="min-w-0">
          <p className="font-[family-name:var(--font-display)] italic text-lg text-[var(--color-ink)] truncate">
            Nover<span className="text-[var(--color-brass)] not-italic"> Invoice</span>
          </p>
          <p className="text-[11px] text-[var(--color-ink-soft)] mt-0.5">Conciergerie & facturation</p>
        </Link>
        <ThemeToggle />
      </div>

      <SidebarNav />

      {membership ? (
        <div className="px-4 py-4 border-t border-[var(--color-line)]">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[var(--color-paper)] transition-colors">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brass)]/15 text-xs font-semibold text-[var(--color-brass-dark)]">
              {(membership.user?.name ?? membership.user?.email ?? "?").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                {membership.user?.name ?? membership.user?.email}
              </p>
              <p className="text-[11px] text-[var(--color-ink-soft)] truncate">
                {ROLE_LABELS[membership.role] ?? membership.role} · {membership.company.name}
              </p>
            </div>
          </div>
          <div className="mt-1 px-2">
            <SignOutButton />
          </div>
        </div>
      ) : null}
    </aside>
  );
}
