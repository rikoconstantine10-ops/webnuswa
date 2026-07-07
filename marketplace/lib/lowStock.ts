import { db } from "./db";
import { createNotification } from "./notifications";
import { waSendToSelf } from "./wa";

const LOW_STOCK_THRESHOLD = 5;

// Dipanggil best-effort setelah stok produk (bukan varian) berkurang. Notifikasi hanya
// sekali per periode menipis (dedup via lowStockAlertedAt) — reset otomatis begitu
// stok naik lagi di atas ambang batas (mis. seller re-stock).
export async function checkLowStockProduct(productId: string): Promise<void> {
  try {
    const p = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, stock: true, storeId: true, lowStockAlertedAt: true },
    });
    if (!p || p.stock === null) return;

    if (p.stock <= LOW_STOCK_THRESHOLD) {
      if (p.lowStockAlertedAt) return;
      await db.product.update({ where: { id: p.id }, data: { lowStockAlertedAt: new Date() } });
      const body = `Sisa ${p.stock} unit. Segera restock supaya tidak kehabisan.`;
      await Promise.allSettled([
        createNotification(p.storeId, "LOW_STOCK", `Stok menipis: ${p.name}`, body, "/dashboard/products"),
        waSendToSelf(p.storeId, `📉 Stok menipis: ${p.name}\n${body}`),
      ]);
    } else if (p.lowStockAlertedAt) {
      await db.product.update({ where: { id: p.id }, data: { lowStockAlertedAt: null } });
    }
  } catch (e) {
    console.error("[low-stock] gagal cek:", e);
  }
}
