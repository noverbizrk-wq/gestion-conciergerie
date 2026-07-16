import { getDashboardMetrics } from "@/modules/dashboard/metrics";
import { KpiCard } from "@/components/kpi-card";

// TODO: remplacer par la résolution de la société courante via la session (Supabase Auth + Membership)
const DEMO_COMPANY_ID = process.env.DEMO_COMPANY_ID ?? "";

export default async function DashboardPage() {
  if (!DEMO_COMPANY_ID) {
    return (
      <EmptyState message="Aucune société configurée. Renseignez DEMO_COMPANY_ID dans .env ou branchez la résolution de session Supabase (voir src/lib/auth-guard.ts)." />
    );
  }

  const metrics = await getDashboardMetrics(DEMO_COMPANY_ID);

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-ink)]">
          Tableau de bord
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-1">
          Vue d&apos;ensemble de l&apos;activité de conciergerie.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <KpiCard label="Chiffre d'affaires HT" value={`${metrics.chiffreAffairesHT.toLocaleString("fr-FR")} €`} />
        <KpiCard label="TVA collectée" value={`${metrics.tvaCollectee.toLocaleString("fr-FR")} €`} />
        <KpiCard
          label="TVA restant à reverser"
          value={`${metrics.tvaRestante.toLocaleString("fr-FR")} €`}
          tone="warning"
        />
        <KpiCard label="Factures payées" value={String(metrics.facturesPayees)} tone="success" />
        <KpiCard label="Factures en attente" value={String(metrics.facturesEnAttente)} tone="warning" />
        <KpiCard label="Factures en retard" value={String(metrics.facturesEnRetard)} tone="danger" />
        <KpiCard label="Logements gérés" value={String(metrics.nombreLogements)} />
        <KpiCard label="Propriétaires" value={String(metrics.nombreProprietaires)} />
      </section>

      <section className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
        <h2 className="font-[family-name:var(--font-display)] text-lg mb-4">Revenus par mois</h2>
        {metrics.revenueByMonth.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-soft)]">
            Aucune facture générée pour le moment — importez vos réservations puis générez vos premières factures.
          </p>
        ) : (
          <ul className="space-y-2">
            {metrics.revenueByMonth.map((row) => (
              <li key={row.month} className="flex items-center gap-3">
                <span className="w-20 text-xs text-[var(--color-ink-soft)]">{row.month}</span>
                <div className="flex-1 h-2 rounded-full bg-[var(--color-paper)]">
                  <div
                    className="h-2 rounded-full bg-[var(--color-brass)]"
                    style={{
                      width: `${Math.min(100, (row.total / Math.max(...metrics.revenueByMonth.map((r) => r.total), 1)) * 100)}%`,
                    }}
                  />
                </div>
                <span className="w-24 text-right text-xs">{row.total.toLocaleString("fr-FR")} €</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--color-line)] p-8 text-sm text-[var(--color-ink-soft)]">
      {message}
    </div>
  );
}
