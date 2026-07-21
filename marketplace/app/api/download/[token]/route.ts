import { NextRequest, NextResponse } from "next/server";
import { createReadStream, existsSync } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { db } from "@/lib/db";

// Download produk digital dengan token sekali-terbit (dibuat saat order lunas).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const dt = await db.downloadToken.findUnique({
    where: { token },
    include: {
      orderItem: { include: { product: { include: { digitalAsset: true } } } },
    },
  });

  if (!dt || dt.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link download tidak valid / kedaluwarsa" }, { status: 404 });
  }
  if (dt.downloadsUsed >= dt.maxDownloads) {
    return NextResponse.json({ error: "Batas jumlah download tercapai" }, { status: 403 });
  }

  const asset = dt.orderItem.product.digitalAsset;
  if (!asset) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
  }

  const uploadDir = path.resolve(process.env.UPLOAD_DIR || "./uploads");
  const filePath = path.join(uploadDir, path.basename(asset.filePath));
  if (!filePath.startsWith(uploadDir) || !existsSync(filePath)) {
    return NextResponse.json({ error: "File tidak ditemukan di server" }, { status: 404 });
  }

  await db.downloadToken.update({
    where: { id: dt.id },
    data: { downloadsUsed: { increment: 1 } },
  });

  const fileStat = await stat(filePath);
  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;

  return new NextResponse(stream, {
    headers: {
      "Content-Disposition": `attachment; filename="${encodeURIComponent(asset.fileName)}"`,
      "Content-Length": String(fileStat.size),
      "Content-Type": "application/octet-stream",
    },
  });
}
