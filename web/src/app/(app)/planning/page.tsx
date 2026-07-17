import Link from "next/link";
import { getCurrentUserMembership } from "@/lib/auth-guard";
import { getWeekPlanningAction, type PlanningEvent } from "@/modules/planning/actions";
import { listEmployeesAction } from "@/modules/employees/actions";
import { listPropertiesAction } from "@/modules/properties/actions";
import { addWeeks, isSameDay, format } from "date-fns";
import { fr } from "date-fns/locale";

const KIND_STYLES: Record<PlanningEvent["kind"], string> = {
  CHECKIN: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/30",
  CHECKOUT: "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/30",
  CLEANING: "bg-[var(--color-ink)]/5 text-[var(--color-ink-soft)] border-[var(--color-line)]",
  MISSION: "bg-[var(--color-brass)]/10 text-[var(--color-brass-dark)] border-[var(--color-brass)]/30",
};

const KIND_LABELS: Record<PlanningEvent["kind"], string> = {
  CHECKIN: "Arrivée",
  CHECKOUT: "Départ",
  CLEANING: "Ménage facturé",
  MISSION: "Mission",
};

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; propertyId?: string; employeeId?: string }>;
}) {
  const membership = await getCurrentUserMembership();
  if (!membership) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--color-line)] p-8 text-sm text-[var(--color-ink-soft)]">
        Votre compte n&apos;est rattaché à aucune société pour le moment.
      </div>
    );
  }

  const { week, propertyId, employeeId } = await searchParams;
  const referenceDate = week ? new Date(week) : new Date();
  const [{ weekStart, days, events }, properties, employees] = await Promise.all([
    getWeekPlanningAction(membership.companyId, referenceDate, { propertyId, employeeId }),
    listPropertiesAction(membership.companyId),
    listEmployeesAction(membership.companyId),
  ]);

  const prevWeek = format(addWeeks(weekStart, -1), "yyyy-MM-dd");
  const nextWeek = format(addWeeks(weekStart, 1), "yyyy-MM-dd");

  function withParams(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { week, propertyId, employeeId, ...overrides };
    Object.entries(merged).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const query = params.toString();
    return `/planning${query ? `?${query}` : ""}`;
  }

  return (
    <div>
      <header className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--color-ink)]">
            Planning
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            Arrivées, départs et missions de la semaine du {format(weekStart, "d MMMM yyyy", { locale: fr })}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={withParams({ week: prevWeek })}
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-raised)] text-sm px-3 py-2 hover:border-[var(--color-brass)] transition-colors"
          >
            ← Semaine précédente
          </Link>
          <Link
            href={withParams({ week: nextWeek })}
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-raised)] text-sm px-3 py-2 hover:border-[var(--color-brass)] transition-colors"
          >
            Semaine suivante →
          </Link>
        </div>
      </header>

      <form method="get" className="mb-6 flex flex-wrap items-center gap-2">
        {week ? <input type="hidden" name="week" value={week} /> : null}
        <select
          name="propertyId"
          defaultValue={propertyId ?? ""}
          className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
        >
          <option value="">Tous les logements</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          name="employeeId"
          defaultValue={employeeId ?? ""}
          className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
        >
          <option value="">Tous les intervenants</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.firstName} {e.lastName}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-[var(--color-ink)] text-white text-sm px-4 py-2 hover:bg-[var(--color-brass-dark)] transition-colors"
        >
          Filtrer
        </button>
        {(propertyId || employeeId) && (
          <Link href={withParams({ propertyId: undefined, employeeId: undefined })} className="text-sm text-[var(--color-ink-soft)] hover:underline">
            Réinitialiser
          </Link>
        )}
      </form>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {days.map((day) => {
          const dayEvents = events.filter((e) => isSameDay(e.date, day));
          return (
            <div key={day.toISOString()} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm flex flex-col min-h-[220px]">
              <div className="px-3 py-2 border-b border-[var(--color-line)] text-center">
                <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                  {format(day, "EEEE", { locale: fr })}
                </p>
                <p className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)]">
                  {format(day, "d MMM", { locale: fr })}
                </p>
              </div>
              <div className="flex-1 p-2 space-y-2">
                {dayEvents.length === 0 ? (
                  <p className="text-xs text-[var(--color-ink-soft)] text-center mt-4">Aucun événement</p>
                ) : (
                  dayEvents.map((event) => {
                    const content = (
                      <div className={`rounded-lg border px-2 py-1.5 text-xs ${KIND_STYLES[event.kind]}`}>
                        <p className="font-medium">{KIND_LABELS[event.kind]}</p>
                        <p>{event.propertyName}</p>
                        {event.kind === "MISSION" ? (
                          <p className="opacity-70">{event.employeeName ?? "Non affectée"}</p>
                        ) : null}
                        <p className="opacity-70">
                          {format(event.date, "HH:mm")}
                          {event.durationMinutes ? ` · ${event.durationMinutes} min` : ""}
                        </p>
                      </div>
                    );
                    return event.missionId ? (
                      <Link key={event.id} href={`/missions/${event.missionId}`} className="block hover:opacity-80 transition-opacity">
                        {content}
                      </Link>
                    ) : (
                      <div key={event.id}>{content}</div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
