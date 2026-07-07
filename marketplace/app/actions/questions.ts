"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser, requireSeller } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

// Pembeli mengajukan pertanyaan pada halaman produk (login opsional).
export async function askQuestionAction(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const productId = String(formData.get("productId") ?? "");
  const question = String(formData.get("question") ?? "").trim();
  const nameInput = String(formData.get("askerName") ?? "").trim();
  if (question.length < 5) return { error: "Pertanyaan minimal 5 karakter" };

  const user = await currentUser();
  const askerName = user?.name || nameInput || "Pembeli";
  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true, slug: true, name: true, storeId: true } });
  if (!product) return { error: "Produk tidak ditemukan" };

  await db.productQuestion.create({
    data: { productId, userId: user?.id ?? null, askerName, question: question.slice(0, 500) },
  });
  revalidatePath(`/p/${product.slug}`);
  createNotification(product.storeId, "QUESTION_NEW", `Pertanyaan baru: ${product.name}`, question.slice(0, 140), "/dashboard/questions");
  return { ok: true };
}

// Penjual menjawab pertanyaan produknya.
export async function answerQuestionAction(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const { store } = await requireSeller();
  const id = String(formData.get("id") ?? "");
  const answer = String(formData.get("answer") ?? "").trim();
  if (answer.length < 2) return { error: "Jawaban terlalu pendek" };

  const q = await db.productQuestion.findUnique({
    where: { id },
    include: { product: { select: { storeId: true, slug: true } } },
  });
  if (!q || q.product.storeId !== store.id) return { error: "Pertanyaan tidak ditemukan" };

  await db.productQuestion.update({
    where: { id },
    data: { answer: answer.slice(0, 1000), answeredAt: new Date() },
  });
  revalidatePath(`/p/${q.product.slug}`);
  revalidatePath("/dashboard/questions");
  return { ok: true };
}
