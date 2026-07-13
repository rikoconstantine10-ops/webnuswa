import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

// Coba ambil daftar model dari provider AI pakai konvensi umum OpenAI-compatible
// (GET {baseUrl}/v1/models). Banyak provider/gateway (OpenAI, OpenRouter, Groq,
// Together, proxy LiteLLM, dst) mendukung ini — tapi tidak semua (mis. kie.ai saat
// ini belum). Kalau gagal, UI di admin akan fallback ke input model manual.
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { baseUrl?: string; apiKey?: string };
  const baseUrl = (body.baseUrl ?? "").trim().replace(/\/+$/, "");
  const apiKey = (body.apiKey ?? "").trim();
  if (!baseUrl || !apiKey) {
    return NextResponse.json({ ok: false, error: "Base URL dan API key wajib diisi" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${baseUrl}/v1/models`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        error: `Provider ini tidak mendukung fetch daftar model otomatis (HTTP ${res.status}). Isi nama model secara manual.`,
      });
    }
    const json = await res.json().catch(() => null);
    const list: unknown = json?.data ?? json?.models ?? json;
    if (!Array.isArray(list)) {
      return NextResponse.json({
        ok: false,
        error: "Format respons model dari provider ini tidak dikenali. Isi nama model secara manual.",
      });
    }
    const models = list
      .map((m) => (typeof m === "string" ? m : m?.id ?? m?.name ?? null))
      .filter((m): m is string => Boolean(m));
    if (models.length === 0) {
      return NextResponse.json({ ok: false, error: "Provider ini tidak mengembalikan model apa pun." });
    }
    return NextResponse.json({ ok: true, models });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error && e.name === "AbortError" ? "Timeout menghubungi provider." : "Provider ini tidak mendukung fetch daftar model otomatis. Isi nama model secara manual.",
    });
  }
}
