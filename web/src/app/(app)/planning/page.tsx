import Link from "next/link";
import { getCurrentUserMembership } from "@/lib/auth-guard";
import { getWeekPlanningAction, type PlanningEvent } from "@/modules/planning/actions";
import { addWeeks, isSameDay, format } from "date-fns";
import { fr } from "date-fns/locale";

const KIND_STYLES: Record<PlanningEvent["kind"], string> = {
  CHECKIN: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/30",
  CHECKOUT: "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/30",
  CLEANING: "bg-[var(--color-brass)]/10 text-[var(--color-brass-dark)] border-[var(--color-brass)]/30",
};

const KIND_LABELS: Record<PlanningEvent["kind"], string> = {
  CHECKIN: "Arrivée",
  CHECKOUT: "Départ",
  CLEANING: "Ménage",
};

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const membership = await getCurrentUserMembership();
  if (!membership) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--color-line)] p-8 text-sm text-[var(--color-ink-soft)]">
        Votre compte n&apos;est rattaché à aucune société pour le moment.
      </div>
    );
  }

  const { week } = await searchParams;
  const referenceDate = week ? new Date(week) : new Date();
  const { weekStart, days, events } = await getWeekPlanningAction(membership.companyId, referenceDate);

  const prevWeek = format(addWeeks(weekStart, -1), "yyyy-MM-dd");
  const nextWeek = format(addWeeks(weekStart, 1), "yyyy-MM-dd");

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-ink)]">
            Planning
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            Arrivées, départs et ménages de la semaine du {format(weekStart, "d MMMM yyyy", { locale: fr })}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/planning?week=${prevWeek}`}
            className="rounded-md border border-[var(--color-line)] bg-[var(--color-paper-raised)] text-sm px-3 py-2 hover:border-[var(--color-brass)] transition-colors"
          >
            ← Semaine précédente
          </Link>
          <Link
            href={`/planning?week=${nextWeek}`}
            className="rounded-md border border-[var(--color-line)] bg-[var(--color-paper-raised)] text-sm px-3 py-2 hover:border-[var(--color-brass)] transition-colors"
          >
            Semaine suivante →
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {days.map((day) => {
          const dayEvents = events.filter((e) => isSameDay(e.date, day));
          return (
            <div key={day.toISOString()} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-raised)] flex flex-col min-h-[220px]">
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
                  dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`rounded-md border px-2 py-1.5 text-xs ${KIND_STYLES[event.kind]}`}
                    >
                      <p className="font-medium">{KIND_LABELS[event.kind]}</p>
                      <p>{event.propertyName}</p>
                      <p className="opacity-70">
                        {format(event.date, "HH:mm")}
                        {event.durationMinutes ? ` · ${event.durationMinutes} min` : ""}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
