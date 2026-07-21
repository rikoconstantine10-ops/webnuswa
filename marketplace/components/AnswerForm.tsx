"use client";

import { useActionState } from "react";
import { answerQuestionAction } from "@/app/actions/questions";

const initial: { error?: string; ok?: boolean } = {};

export default function AnswerForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(answerQuestionAction, initial);
  return (
    <form action={action} className="mt-2 flex gap-2 items-start">
      <input type="hidden" name="id" value={id} />
      <textarea
        name="answer"
        required
        rows={2}
        placeholder="Tulis jawaban…"
        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
      />
      <button
        disabled={pending}
        className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 cursor-pointer shrink-0"
      >
        {pending ? "…" : "Jawab"}
      </button>
      {state.error && <span className="text-xs text-red-500">{state.error}</span>}
    </form>
  );
}
