"use client";

import { useActionState } from "react";
import { replyReviewAction } from "@/app/actions/reviews";

export default function ReviewReplyForm({ reviewId, existing }: { reviewId: string; existing: string | null }) {
  const [state, formAction, pending] = useActionState(replyReviewAction, {});
  return (
    <form action={formAction} className="mt-2 flex gap-2">
      <input type="hidden" name="reviewId" value={reviewId} />
      <input
        type="text"
        name="reply"
        defaultValue={existing ?? ""}
        placeholder="Balas ulasan ini…"
        className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
      />
      <button
        disabled={pending}
        className="bg-teal-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-teal-700 disabled:opacity-50"
      >
        {state.ok ? "✓" : pending ? "…" : "Balas"}
      </button>
    </form>
  );
}
