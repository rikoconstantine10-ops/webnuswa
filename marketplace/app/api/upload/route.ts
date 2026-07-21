import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { currentUser } from "@/lib/auth";

const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8 MB
const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];

// Upload oleh seller. Default: file produk digital (privat, hanya via token download).
// ?kind=image: gambar produk/toko, disajikan publik lewat /api/media/[file].
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user?.store) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const isImage = req.nextUrl.searchParams.get("kind") === "image";
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file wajib diisi" }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const ext = path.extname(safeName).toLowerCase();
  const baseDir = path.resolve(process.env.UPLOAD_DIR || "./uploads");

  if (isImage) {
    if (!IMAGE_EXT.includes(ext)) {
      return NextResponse.json({ error: "format gambar harus jpg/png/webp/gif/avif" }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "gambar maksimal 8MB" }, { status: 400 });
    }
    const imagesDir = path.join(baseDir, "images");
    await mkdir(imagesDir, { recursive: true });
    const storedName = `${randomBytes(8).toString("hex")}${ext}`;
    await writeFile(path.join(imagesDir, storedName), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url: `/api/media/${storedName}`, fileName: file.name });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "maksimal 100MB" }, { status: 400 });
  }
  await mkdir(baseDir, { recursive: true });
  const storedName = `${randomBytes(8).toString("hex")}-${safeName}`;
  await writeFile(path.join(baseDir, storedName), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ filePath: storedName, fileName: file.name });
}
