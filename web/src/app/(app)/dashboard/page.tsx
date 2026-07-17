import { getDashboardMetrics } from "@/modules/dashboard/metrics";
import { KpiCard } from "@/components/kpi-card";
import { getCurrentUserMembership } from "@/lib/auth-guard";

export default async function DashboardPage() {
  const membership = await getCurrentUserMembership();
  if (!membership) {
    return (
      <EmptyState message="Votre compte n'est rattaché à aucune société pour le moment. Contactez un administrateur." />
    );
  }

  const metrics = await getDashboardMetrics(membership.companyId);

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--color-ink)]">
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
        <KpiCard label="Taux d'occupation (mois)" value={`${metrics.tauxOccupation.toFixed(0)} %`} />
        <KpiCard label="Revenu moyen / réservation" value={`${metrics.revenuMoyenParReservation.toFixed(0)} €`} />
        <KpiCard label="Revenu moyen / nuit" value={`${metrics.revenuMoyenParNuit.toFixed(0)} €`} />
        <KpiCard label="Missions à venir" value={String(metrics.missionsAVenir)} />
        <KpiCard
          label="Missions en retard"
          value={String(metrics.missionsEnRetard)}
          tone={metrics.missionsEnRetard > 0 ? "danger" : undefined}
        />
        <KpiCard
          label="Incidents ouverts"
          value={String(metrics.incidentsOuverts)}
          tone={metrics.incidentsOuverts > 0 ? "warning" : undefined}
        />
        <KpiCard
          label="Satisfaction client"
          value={metrics.satisfactionMoyenne ? `${metrics.satisfactionMoyenne.toFixed(1)} / 5` : "—"}
          hint={metrics.nombreAvis > 0 ? `${metrics.nombreAvis} avis publiés` : "Aucun avis publié"}
        />
      </section>

      <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-6">
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

      <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm p-6 mt-6">
        <h2 className="font-[family-name:var(--font-display)] text-lg mb-4">Rentabilité par logement</h2>
        {metrics.rentabiliteParLogement.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-soft)]">
            Aucune donnée de réservation pour le moment.
          </p>
        ) : (
          <ul className="space-y-2">
            {metrics.rentabiliteParLogement.map((row) => (
              <li key={row.name} className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-ink)]">{row.name}</span>
                <span className={row.net >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}>
                  {row.net.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-[var(--color-ink-soft)] mt-3">
          Estimation : loyer net − commission plateforme − frais de ménage, sur l&apos;ensemble des réservations importées.
        </p>
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
