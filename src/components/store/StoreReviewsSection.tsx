"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, ThumbsUp, Loader2, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  verifiedPurchase: boolean;
  isAdminSeed: boolean;
  seedAuthorName: string | null;
  user: { name: string | null; avatar: string | null } | null;
}

interface Props {
  storeSlug: string;
  productSlug: string;
  productRating: number;
  reviewCount: number;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

function DistributionBar({ count, total, label }: { count: number; total: number; label: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-4 text-right text-text-muted">{label}</span>
      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-warning rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-xs text-text-muted text-right">{count}</span>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const date = new Date(review.createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
  const displayName = review.user?.name ?? review.seedAuthorName ?? "Customer";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
          {review.user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={review.user.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-sm text-text">{displayName}</span>
              {review.verifiedPurchase && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-green-600 bg-green-50 rounded-full px-1.5 py-0.5">
                  <BadgeCheck className="w-3 h-3" />Verified Buyer
                </span>
              )}
            </div>
            <span className="text-xs text-text-muted">{date}</span>
          </div>
          <div className="flex mb-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-3.5 h-3.5 ${s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}
              />
            ))}
          </div>
          {review.comment && <p className="text-sm text-text-muted leading-relaxed">{review.comment}</p>}
        </div>
      </div>
    </div>
  );
}

export default function StoreReviewsSection({ storeSlug, productSlug, productRating, reviewCount }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [distribution, setDistribution] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [total, setTotal] = useState(reviewCount);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadReviews = useCallback(async (p: number, append = false) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const res = await fetch(`/api/store/${storeSlug}/products/${productSlug}/reviews?page=${p}`);
      const data = await res.json();
      setReviews((prev) => append ? [...prev, ...data.reviews] : data.reviews);
      setTotal(data.total);
      setDistribution(data.distribution);
      setHasMore(p * 10 < data.total);
      setPage(p);
    } catch { /* silent */ } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [storeSlug, productSlug]);

  useEffect(() => { loadReviews(1); }, [loadReviews]);

  const avgRating = productRating || 5;

  if (loading) {
    return (
      <div className="mt-10 flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="mt-10 text-center py-10">
        <ThumbsUp className="w-10 h-10 text-border mx-auto mb-3" />
        <p className="font-medium text-text mb-1">No reviews yet</p>
        <p className="text-sm text-text-muted">Be the first to review this product on the main store.</p>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold text-text mb-4">Customer Reviews</h2>

      {/* Summary */}
      <div className="flex flex-col sm:flex-row gap-6 p-5 bg-surface rounded-2xl mb-6">
        <div className="flex flex-col items-center justify-center sm:w-32 shrink-0">
          <span className="text-4xl font-black text-text">{avgRating.toFixed(1)}</span>
          <StarRow rating={avgRating} />
          <span className="text-xs text-text-muted mt-1">{total} review{total !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => (
            <DistributionBar key={star} label={star} count={distribution[star] ?? 0} total={total} />
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="grid gap-3">
        {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={() => loadReviews(page + 1, true)}
            disabled={loadingMore}
            className="rounded-full"
          >
            {loadingMore ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</> : "Load More Reviews"}
          </Button>
        </div>
      )}
    </div>
  );
}
