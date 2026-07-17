"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/auth";
import { slugify, randomSuffix } from "@/lib/slug";
import { landingBlockSchema, parseLandingBlocks, type LandingBlock } from "@/lib/landingBlocks";
import { buildTemplateBlocks, type LandingTemplateKey } from "@/lib/landingTemplates";
import { notifyLandingLead } from "@/lib/notify";

function newId(): string {
  return randomBytes(6).toString("hex");
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = slugify(base) || "landing";
  for (let i = 0; i < 5; i++) {
    const existing = await db.landingPage.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${slugify(base) || "landing"}-${randomSuffix()}`;
  }
  return `${slugify(base) || "landing"}-${randomSuffix(6)}`;
}

async function loadOwnedLandingPage(id: string, storeId: string) {
  const lp = await db.landingPage.findUnique({ where: { id } });
  if (!lp || lp.storeId !== storeId) return null;
  return lp;
}

function revalidateLanding(id: string, slug: string) {
  revalidatePath("/dashboard/landing");
  revalidatePath(`/dashboard/landing/${id}`);
  revalidatePath(`/l/${slug}`);
}

export async function createLandingPageAction(formData: FormData) {
  const { store } = await requireSeller();
  const productId = String(formData.get("productId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const template = String(formData.get("template") ?? "blank") as LandingTemplateKey;
  if (!productId || title.length < 3) return;

  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true, storeId: true } });
  if (!product || product.storeId !== store.id) return;

  const slug = await uniqueSlug(title);
  const blocks = buildTemplateBlocks(template);
  const created = await db.landingPage.create({
    data: { storeId: store.id, productId, title, slug, blocks },
  });
  revalidatePath("/dashboard/landing");
  redirect(`/dashboard/landing/${created.id}`);
}

export async function duplicateLandingPageAction(formData: FormData) {
  const { store } = await requireSeller();
  const id = String(formData.get("id") ?? "");
  const original = await loadOwnedLandingPage(id, store.id);
  if (!original) return;

  const title = `${original.title} (Salinan)`;
  const slug = await uniqueSlug(title);
  await db.landingPage.create({
    data: {
      storeId: store.id,
      productId: original.productId,
      title,
      slug,
      blocks: original.blocks as object,
      published: false,
    },
  });
  revalidatePath("/dashboard/landing");
}

export async function updateLandingMetaAction(formData: FormData) {
  const { store } = await requireSeller();
  const id = String(formData.get("id") ?? "");
  const lp = await loadOwnedLandingPage(id, store.id);
  if (!lp) return;

  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const ogTitle = String(formData.get("ogTitle") ?? "").trim();
  const ogDescription = String(formData.get("ogDescription") ?? "").trim();
  const ogImageUrl = String(formData.get("ogImageUrl") ?? "").trim();
  if (title.length < 3) return;

  const slug = slugInput ? await uniqueSlug(slugInput, lp.id) : lp.slug;
  await db.landingPage.update({
    where: { id },
    data: {
      title,
      slug,
      ogTitle: ogTitle || null,
      ogDescription: ogDescription || null,
      ogImageUrl: ogImageUrl || null,
    },
  });
  revalidateLanding(id, lp.slug);
  revalidateLanding(id, slug);
}

export async function togglePublishLandingAction(formData: FormData) {
  const { store } = await requireSeller();
  const id = String(formData.get("id") ?? "");
  const lp = await loadOwnedLandingPage(id, store.id);
  if (!lp) return;
  await db.landingPage.update({ where: { id }, data: { published: !lp.published } });
  revalidateLanding(id, lp.slug);
}

export async function deleteLandingPageAction(formData: FormData) {
  const { store } = await requireSeller();
  const id = String(formData.get("id") ?? "");
  const lp = await loadOwnedLandingPage(id, store.id);
  if (!lp) return;
  await db.landingPage.delete({ where: { id } });
  revalidatePath("/dashboard/landing");
}

// ===== Blok: JSON dibangun & divalidasi penuh di client (state React terkontrol per tipe),
// server cuma parse ulang dengan zod (landingBlockSchema) sebelum simpan — jadi tetap aman
// walau formatnya JSON, karena tak pernah dipercaya tanpa validasi skema.

async function loadBlocks(id: string, storeId: string): Promise<{ lp: NonNullable<Awaited<ReturnType<typeof loadOwnedLandingPage>>>; blocks: LandingBlock[] } | null> {
  const lp = await loadOwnedLandingPage(id, storeId);
  if (!lp) return null;
  return { lp, blocks: parseLandingBlocks(lp.blocks) };
}

export async function addLandingBlockAction(formData: FormData) {
  const { store } = await requireSeller();
  const id = String(formData.get("landingPageId") ?? "");
  const raw = String(formData.get("blockJson") ?? "");
  const loaded = await loadBlocks(id, store.id);
  if (!loaded) return;

  let parsed;
  try {
    parsed = landingBlockSchema.parse({ ...JSON.parse(raw), id: newId() });
  } catch {
    return;
  }
  await db.landingPage.update({ where: { id }, data: { blocks: [...loaded.blocks, parsed] } });
  revalidateLanding(id, loaded.lp.slug);
}

export async function updateLandingBlockAction(formData: FormData) {
  const { store } = await requireSeller();
  const id = String(formData.get("landingPageId") ?? "");
  const raw = String(formData.get("blockJson") ?? "");
  const loaded = await loadBlocks(id, store.id);
  if (!loaded) return;

  let parsed;
  try {
    parsed = landingBlockSchema.parse(JSON.parse(raw));
  } catch {
    return;
  }
  const idx = loaded.blocks.findIndex((b) => b.id === parsed.id);
  if (idx === -1) return;
  const next = [...loaded.blocks];
  next[idx] = parsed;
  await db.landingPage.update({ where: { id }, data: { blocks: next } });
  revalidateLanding(id, loaded.lp.slug);
}

export async function removeLandingBlockAction(formData: FormData) {
  const { store } = await requireSeller();
  const id = String(formData.get("landingPageId") ?? "");
  const blockId = String(formData.get("blockId") ?? "");
  const loaded = await loadBlocks(id, store.id);
  if (!loaded) return;
  await db.landingPage.update({ where: { id }, data: { blocks: loaded.blocks.filter((b) => b.id !== blockId) } });
  revalidateLanding(id, loaded.lp.slug);
}

export async function reorderLandingBlocksAction(landingPageId: string, orderedIds: string[]) {
  const { store } = await requireSeller();
  const loaded = await loadBlocks(landingPageId, store.id);
  if (!loaded) return;
  const byId = new Map(loaded.blocks.map((b) => [b.id, b]));
  const next = orderedIds.map((bid) => byId.get(bid)).filter((b): b is LandingBlock => Boolean(b));
  if (next.length !== loaded.blocks.length) return; // id set berubah — abaikan, jangan hilangkan blok
  await db.landingPage.update({ where: { id: landingPageId }, data: { blocks: next } });
  revalidateLanding(landingPageId, loaded.lp.slug);
}

// ===== Publik: pengunjung landing page mengisi nama/HP di form order tapi belum tentu
// checkout — ditangkap sebagai lead supaya seller bisa follow-up manual/japri lebih cepat.
export async function captureLeadAction(landingPageId: string, name: string, phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return;
  const normalized = digits.startsWith("0") ? `62${digits.slice(1)}` : digits.startsWith("8") ? `62${digits}` : digits;

  const existing = await db.landingLead.findUnique({
    where: { landingPageId_phone: { landingPageId, phone: normalized } },
  });
  if (existing) {
    if (name.trim() && !existing.name) {
      await db.landingLead.update({ where: { id: existing.id }, data: { name: name.trim().slice(0, 100) } });
    }
    return;
  }
  const lead = await db.landingLead.create({
    data: { landingPageId, phone: normalized, name: name.trim().slice(0, 100) || null },
  });
  notifyLandingLead(lead.id);
}
