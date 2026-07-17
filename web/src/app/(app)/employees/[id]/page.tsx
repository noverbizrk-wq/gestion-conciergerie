import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUserMembership } from "@/lib/auth-guard";
import { getEmployeeAction } from "@/modules/employees/actions";
import { EmployeeEditForm } from "./edit-form";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const membership = await getCurrentUserMembership();
  if (!membership) notFound();

  const employee = await getEmployeeAction(id, membership.companyId);
  if (!employee) notFound();

  return (
    <div>
      <Link
        href="/employees"
        className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
      >
        ← Retour aux intervenants
      </Link>

      <header className="mt-2 mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--color-ink)]">
          {employee.firstName} {employee.lastName}
        </h1>
      </header>

      <EmployeeEditForm
        companyId={membership.companyId}
        employee={{
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          type: employee.type,
          zone: employee.zone,
          skills: employee.skills,
          hourlyRate: employee.hourlyRate ? Number(employee.hourlyRate) : null,
          perMissionRate: employee.perMissionRate ? Number(employee.perMissionRate) : null,
          notes: employee.notes,
          active: employee.active,
        }}
      />
    </div>
  );
}
