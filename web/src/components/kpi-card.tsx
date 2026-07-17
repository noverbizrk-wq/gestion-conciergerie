export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneColor = {
    default: "var(--color-ink)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    danger: "var(--color-danger)",
  }[tone];

  return (
    <div className="group relative overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] px-5 py-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <span
        className="absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: toneColor }}
      />
      <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-soft)]">{label}</p>
      <p
        className="mt-2 font-[family-name:var(--font-display)] text-3xl leading-none"
        style={{ color: toneColor }}
      >
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-xs text-[var(--color-ink-soft)]">{hint}</p> : null}
    </div>
  );
}
