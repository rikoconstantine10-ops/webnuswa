import { NextRequest, NextResponse } from "next/server";
import { searchAreas } from "@/lib/biteship";

// Autocomplete area untuk form alamat (dipakai di checkout & pengaturan toko).
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 3) return NextResponse.json({ areas: [] });
  const areas = await searchAreas(q);
  return NextResponse.json({ areas });
}
