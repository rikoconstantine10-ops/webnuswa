import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import AnswerForm from "@/components/AnswerForm";

export const dynamic = "force-dynamic";

export default async function SellerQuestionsPage() {
  const { store } = await requireSeller();
  const questions = await db.productQuestion.findMany({
    where: { product: { storeId: store.id } },
    orderBy: [{ answeredAt: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: { product: { select: { name: true, slug: true } } },
  });
  const unanswered = questions.filter((q) => !q.answer);
  const answered = questions.filter((q) => q.answer);

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-1">Tanya Jawab</h1>
      <p className="text-slate-500 text-sm mb-6">
        Jawab pertanyaan pembeli untuk meningkatkan kepercayaan &amp; konversi.
      </p>

      <h2 className="font-bold text-sm text-slate-500 mb-2">
        Belum Dijawab {unanswered.length > 0 && <span className="text-red-500">({unanswered.length})</span>}
      </h2>
      {unanswered.length === 0 ? (
        <p className="text-slate-400 text-sm mb-6">Tidak ada pertanyaan menunggu. 🎉</p>
      ) : (
        <div className="space-y-3 mb-8">
          {unanswered.map((q) => (
            <div key={q.id} className="bg-white rounded-2xl border border-amber-200 p-4">
              <Link href={`/p/${q.product.slug}`} className="text-xs text-teal-600 font-semibold hover:underline">
                {q.product.name}
              </Link>
              <p className="text-sm mt-1">
                <span className="font-semibold">{q.askerName}:</span> {q.question}
              </p>
              <AnswerForm id={q.id} />
            </div>
          ))}
        </div>
      )}

      {answered.length > 0 && (
        <>
          <h2 className="font-bold text-sm text-slate-500 mb-2">Sudah Dijawab</h2>
          <div className="space-y-3">
            {answered.map((q) => (
              <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                <Link href={`/p/${q.product.slug}`} className="text-xs text-teal-600 font-semibold hover:underline">
                  {q.product.name}
                </Link>
                <p className="text-sm mt-1">
                  <span className="font-semibold">{q.askerName}:</span> {q.question}
                </p>
                <div className="mt-2 ml-3 pl-3 border-l-2 border-teal-200 text-sm">
                  <span className="font-semibold text-teal-700">Kamu:</span>{" "}
                  <span className="text-slate-600">{q.answer}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
