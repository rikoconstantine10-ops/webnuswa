import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

function csvCell(v: string | number | boolean | null | undefined): string {
  const s = v === null || v === undefined ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

// Export semua penarikan dana seller jadi CSV, buat rekonsiliasi/laporan admin.
// GET /api/admin/withdrawals/export?status=PENDING (opsional)
export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status") ?? undefined;

  const withdrawals = await db.withdrawal.findMany({
    where: status ? { status } : {},
    include: { store: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  const header = [
    "Toko", "Jumlah", "Bank", "No Rekening", "Nama Rekening",
    "Status", "Provider", "Ref Provider", "Alasan Gagal",
    "Dibuat", "Diproses",
  ];
  const rows = withdrawals.map((w) => [
    csvCell(w.store.name),
    csvCell(w.amount),
    csvCell(w.bankName),
    csvCell(w.bankAccountNumber),
    csvCell(w.bankAccountName),
    csvCell(w.status),
    csvCell(w.provider),
    csvCell(w.providerRef),
    csvCell(w.failureReason),
    csvCell(w.createdAt.toISOString()),
    csvCell(w.processedAt ? w.processedAt.toISOString() : ""),
  ].join(","));

  const csv = [header.map(csvCell).join(","), ...rows].join("\n");
  const filename = `penarikan-dana-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
