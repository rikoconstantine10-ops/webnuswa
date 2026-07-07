import { NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";

function csvCell(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Menunggu Bayar",
  PAID: "Perlu Diproses",
  PROCESSING: "Diproses",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Batal",
  EXPIRED: "Kedaluwarsa",
  DISPUTED: "Sengketa",
  REFUNDED: "Refund",
};

// Export pesanan toko sendiri jadi CSV, dipakai buat pembukuan/laporan seller.
// GET /api/dashboard/orders/export
export async function GET() {
  const { store } = await requireSeller();

  const orders = await db.order.findMany({
    where: { storeId: store.id, status: { not: "PENDING_PAYMENT" } },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const header = [
    "Kode", "Status", "Pembeli", "Email", "Telepon", "Metode Bayar",
    "Subtotal", "Ongkir", "Diskon", "Total", "Kurir", "No Resi",
    "Dibuat", "Dibayar",
  ];
  const rows = orders.map((o) => [
    csvCell(o.code),
    csvCell(STATUS_LABEL[o.status] ?? o.status),
    csvCell(o.buyerName),
    csvCell(o.buyerEmail),
    csvCell(o.buyerPhone),
    csvCell(o.paymentType),
    csvCell(o.subtotal),
    csvCell(o.shippingCost),
    csvCell(o.discountAmount),
    csvCell(o.total),
    csvCell(o.courier),
    csvCell(o.trackingNumber),
    csvCell(o.createdAt.toISOString()),
    csvCell(o.paidAt ? o.paidAt.toISOString() : ""),
  ].join(","));

  const csv = [header.map(csvCell).join(","), ...rows].join("\n");
  const filename = `pesanan-${store.slug}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
