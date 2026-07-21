import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import Stars from "@/components/Stars";
import ReviewReplyForm from "@/components/ReviewReplyForm";

export const dynamic = "force-dynamic";

export default async function SellerReviewsPage() {
  const { store } = await requireSeller();
  const reviews = await db.review.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true } } },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Ulasan Toko</h1>
        {store.ratingCount > 0 && (
          <span className="flex items-center gap-2 text-sm">
            <Stars rating={store.ratingAvg} />
            <span className="font-bold">{store.ratingAvg.toFixed(1)}</span>
            <span className="text-slate-500">· {store.ratingCount} ulasan</span>
          </span>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-slate-400 text-sm">Belum ada ulasan.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">
                  {r.buyerName} · <span className="text-slate-500 font-normal">{r.product.name}</span>
                </span>
                <Stars rating={r.rating} />
              </div>
              {r.comment && <p className="text-sm text-slate-600 mt-1">{r.comment}</p>}
              <ReviewReplyForm reviewId={r.id} existing={r.sellerReply} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
