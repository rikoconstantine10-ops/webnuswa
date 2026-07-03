import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { currentUser } from "@/lib/auth";

const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

// Upload file produk digital oleh seller. Disimpan di luar folder public
// agar hanya bisa diunduh lewat token (/api/download/[token]).
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user?.store) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file wajib diisi" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "maksimal 100MB" }, { status: 400 });
  }

  const uploadDir = path.resolve(process.env.UPLOAD_DIR || "./uploads");
  await mkdir(uploadDir, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const storedName = `${randomBytes(8).toString("hex")}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, storedName), buffer);

  return NextResponse.json({ filePath: storedName, fileName: file.name });
}
