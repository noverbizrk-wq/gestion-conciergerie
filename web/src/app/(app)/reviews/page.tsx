import { getCurrentUserMembership } from "@/lib/auth-guard";
import { listReviewsAction } from "@/modules/reviews/actions";
import { listPropertiesAction } from "@/modules/properties/actions";
import { NewReviewForm } from "./new-review-form";
import { ReviewActions } from "./review-actions";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "À traiter",
  PUBLISHED: "Publié",
  REJECTED: "Rejeté",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  PUBLISHED: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  REJECTED: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
};

export default async function ReviewsPage() {
  const membership = await getCurrentUserMembership();
  if (!membership) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--color-line)] p-8 text-sm text-[var(--color-ink-soft)]">
        Votre compte n&apos;est rattaché à aucune société pour le moment.
      </div>
    );
  }

  const [reviews, properties] = await Promise.all([
    listReviewsAction(membership.companyId),
    listPropertiesAction(membership.companyId),
  ]);

  const counts = reviews.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const avgRating =
    reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

  return (
    <div>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--color-ink)]">
            Avis clients
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            {reviews.length} avis
            {reviews.length > 0 ? ` · note moyenne ${avgRating.toFixed(1)}/5` : ""}
          </p>
        </div>
        <NewReviewForm
          companyId={membership.companyId}
          properties={properties.map((p) => ({ id: p.id, name: p.name }))}
        />
      </header>

      <div className="grid grid-cols-3 gap-3 mb-6 max-w-md">
        {(["PENDING", "PUBLISHED", "REJECTED"] as const).map((status) => (
          <div
            key={status}
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm px-3 py-3 text-center"
          >
            <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-ink)]">
              {counts[status] ?? 0}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-soft)] mt-1">
              {STATUS_LABELS[status]}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-paper)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] border-b border-[var(--color-line)]">
            <tr>
              <th className="px-5 py-3.5">Logement</th>
              <th className="px-5 py-3.5">Auteur</th>
              <th className="px-5 py-3.5">Note</th>
              <th className="px-5 py-3.5">Commentaire</th>
              <th className="px-5 py-3.5">Statut</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-ink-soft)]">
                  Aucun avis pour le moment.
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr key={review.id} className="border-t border-[var(--color-line)] transition-colors hover:bg-[var(--color-paper)]">
                  <td className="px-5 py-3.5">{review.property.name}</td>
                  <td className="px-5 py-3.5">{review.authorName ?? "Anonyme"}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-[var(--color-brass)]">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--color-ink-soft)] max-w-xs truncate">
                    {review.comment ?? "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[review.status]}`}>
                      {STATUS_LABELS[review.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {review.status === "PENDING" ? (
                      <ReviewActions reviewId={review.id} companyId={membership.companyId} />
                    ) : null}
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
