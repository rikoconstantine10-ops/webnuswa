// Harga efektif produk: pakai harga flash sale bila diskon sedang aktif.
// Hanya berlaku untuk harga dasar produk (varian punya harganya sendiri).
export function isSaleActive(p: { salePrice: number | null; saleEndsAt: Date | null }): boolean {
  return p.salePrice != null && p.salePrice > 0 && (p.saleEndsAt == null || p.saleEndsAt.getTime() > Date.now());
}

export function effectivePrice(p: { price: number; salePrice: number | null; saleEndsAt: Date | null }): number {
  return isSaleActive(p) ? (p.salePrice as number) : p.price;
}
