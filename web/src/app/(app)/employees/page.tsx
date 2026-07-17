import Link from "next/link";
import { listEmployeesAction } from "@/modules/employees/actions";
import { getCurrentUserMembership } from "@/lib/auth-guard";
import { EmployeesToolbar } from "./employees-toolbar";

const TYPE_LABELS: Record<string, string> = {
  SALARIE: "Salarié",
  PRESTATAIRE: "Prestataire",
};

export default async function EmployeesPage() {
  const membership = await getCurrentUserMembership();
  const employees = membership ? await listEmployeesAction(membership.companyId) : [];

  return (
    <div>
      <EmployeesToolbar companyId={membership?.companyId ?? ""} count={employees.length} />

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-paper)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] border-b border-[var(--color-line)]">
            <tr>
              <th className="px-5 py-3.5">Nom</th>
              <th className="px-5 py-3.5">Type</th>
              <th className="px-5 py-3.5">Zone</th>
              <th className="px-5 py-3.5">Compétences</th>
              <th className="px-5 py-3.5">Contact</th>
              <th className="px-5 py-3.5">Statut</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-ink-soft)]">
                  Aucun intervenant pour le moment. Ajoutez le premier pour commencer.
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr
                  key={employee.id}
                  className="border-t border-[var(--color-line)] transition-colors hover:bg-[var(--color-paper)]"
                >
                  <td className="px-5 py-3.5 font-medium">
                    <Link
                      href={`/employees/${employee.id}`}
                      className="hover:text-[var(--color-brass-dark)] hover:underline"
                    >
                      {employee.firstName} {employee.lastName}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">{TYPE_LABELS[employee.type] ?? employee.type}</td>
                  <td className="px-5 py-3.5">{employee.zone ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    {employee.skills.length > 0 ? employee.skills.join(", ") : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[var(--color-ink-soft)]">
                    {employee.email ?? employee.phone ?? "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={
                        employee.active
                          ? "rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] px-2.5 py-1 text-xs font-medium"
                          : "rounded-full bg-[var(--color-ink)]/5 text-[var(--color-ink-soft)] px-2.5 py-1 text-xs font-medium"
                      }
                    >
                      {employee.active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
