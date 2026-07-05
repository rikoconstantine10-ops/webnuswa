"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/auth";
import { slugify, randomSuffix } from "@/lib/slug";

// Parser CSV sederhana yang mendukung kolom ber-tanda kutip & koma di dalamnya.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); rows.push(row); row = []; field = "";
    } else if (c === "\r") {
      // abaikan
    } else field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

export async function importProductsAction(
  _prev: { error?: string; created?: number; skipped?: string[] },
  formData: FormData
): Promise<{ error?: string; created?: number; skipped?: string[] }> {
  const { store } = await requireSeller();
  const raw = String(formData.get("csv") ?? "").trim();
  if (!raw) return { error: "Tempel data CSV terlebih dahulu" };

  const rows = parseCsv(raw);
  if (rows.length < 2) return { error: "CSV harus punya header + minimal 1 baris produk" };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const iName = idx("name");
  const iPrice = idx("price");
  const iType = idx("type");
  if (iName < 0 || iPrice < 0) {
    return { error: "Header wajib memuat kolom: name, price (opsional: type, description, stock, weight, category, image, saleprice, saledays)" };
  }
  const iDesc = idx("description");
  const iStock = idx("stock");
  const iWeight = idx("weight");
  const iCategory = idx("category");
  const iImage = idx("image");
  const iSalePrice = idx("saleprice");
  const iSaleDays = idx("saledays");

  const categories = await db.category.findMany({ select: { id: true, name: true, slug: true } });
  const findCategory = (v: string) => {
    const s = v.trim().toLowerCase();
    if (!s) return null;
    return categories.find((c) => c.name.toLowerCase() === s || c.slug.toLowerCase() === s)?.id ?? null;
  };

  let created = 0;
  const skipped: string[] = [];

  for (let r = 1; r < rows.length; r++) {
    const cols = rows[r];
    const name = (cols[iName] ?? "").trim();
    const priceNum = parseInt((cols[iPrice] ?? "").replace(/\D/g, ""), 10);
    if (name.length < 3) { skipped.push(`Baris ${r + 1}: nama terlalu pendek`); continue; }
    if (!Number.isFinite(priceNum) || priceNum < 500) { skipped.push(`Baris ${r + 1} (${name}): harga tidak valid`); continue; }

    const type = iType >= 0 && (cols[iType] ?? "").trim().toUpperCase() === "DIGITAL" ? "DIGITAL" : "PHYSICAL";
    // Produk digital butuh file → tidak bisa lewat import massal.
    if (type === "DIGITAL") { skipped.push(`Baris ${r + 1} (${name}): produk digital tidak didukung import massal`); continue; }

    const stock = iStock >= 0 ? parseInt((cols[iStock] ?? "").replace(/\D/g, ""), 10) : NaN;
    const weight = iWeight >= 0 ? parseInt((cols[iWeight] ?? "").replace(/\D/g, ""), 10) : NaN;
    const salePrice = iSalePrice >= 0 ? parseInt((cols[iSalePrice] ?? "").replace(/\D/g, ""), 10) : NaN;
    const saleDays = iSaleDays >= 0 ? parseInt((cols[iSaleDays] ?? "").replace(/\D/g, ""), 10) : NaN;

    let slug = slugify(name);
    if (await db.product.findUnique({ where: { slug } })) slug = `${slug}-${randomSuffix()}`;

    await db.product.create({
      data: {
        storeId: store.id,
        name,
        slug,
        description: iDesc >= 0 ? (cols[iDesc] ?? "").trim() || null : null,
        type: "PHYSICAL",
        price: priceNum,
        stock: Number.isFinite(stock) ? stock : 0,
        weightGrams: Number.isFinite(weight) ? weight : 1000,
        imageUrl: iImage >= 0 ? (cols[iImage] ?? "").trim() || null : null,
        categoryId: iCategory >= 0 ? findCategory(cols[iCategory] ?? "") : null,
        salePrice: Number.isFinite(salePrice) && salePrice > 0 ? salePrice : null,
        saleEndsAt: Number.isFinite(salePrice) && salePrice > 0 && Number.isFinite(saleDays) && saleDays > 0
          ? new Date(Date.now() + saleDays * 86400000) : null,
      },
    });
    created++;
  }

  revalidatePath("/dashboard/products");
  return { created, skipped };
}
