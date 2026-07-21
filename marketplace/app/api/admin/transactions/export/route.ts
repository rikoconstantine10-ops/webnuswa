import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

function csvCell(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

// Export semua transaksi (order) platform jadi CSV, buat rekonsiliasi/laporan admin.
// GET /api/admin/transactions/export?status=PAID (opsional)
export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status") ?? undefined;

  const orders = await db.order.findMany({
    where: status ? { status } : {},
    include: { store: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  const header = [
    "Kode", "Toko", "Pembeli", "Email", "Total", "Fee Platform",
    "Metode Bayar", "Status", "Dibuat", "Dibayar",
  ];
  const rows = orders.map((o) => [
    csvCell(o.code),
    csvCell(o.store.name),
    csvCell(o.buyerName),
    csvCell(o.buyerEmail),
    csvCell(o.total),
    csvCell(o.platformFee),
    csvCell(o.paymentType),
    csvCell(o.status),
    csvCell(o.createdAt.toISOString()),
    csvCell(o.paidAt ? o.paidAt.toISOString() : ""),
  ].join(","));

  const csv = [header.map(csvCell).join(","), ...rows].join("\n");
  const filename = `transaksi-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
