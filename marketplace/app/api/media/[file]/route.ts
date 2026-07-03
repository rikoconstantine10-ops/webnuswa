import { NextRequest, NextResponse } from "next/server";
import { createReadStream, existsSync } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

// Menyajikan gambar produk/toko yang diunggah seller (subfolder images di UPLOAD_DIR).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  const imagesDir = path.resolve(process.env.UPLOAD_DIR || "./uploads", "images");
  const filePath = path.join(imagesDir, path.basename(file));
  const ext = path.extname(filePath).toLowerCase();

  if (!filePath.startsWith(imagesDir) || !MIME[ext] || !existsSync(filePath)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const fileStat = await stat(filePath);
  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
  return new NextResponse(stream, {
    headers: {
      "Content-Type": MIME[ext],
      "Content-Length": String(fileStat.size),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
