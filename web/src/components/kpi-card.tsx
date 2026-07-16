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
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-raised)] px-5 py-4">
      <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">{label}</p>
      <p
        className="mt-2 font-[family-name:var(--font-display)] text-3xl"
        style={{ color: toneColor }}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{hint}</p> : null}
    </div>
  );
}
