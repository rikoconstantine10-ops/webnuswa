// Adapter pencairan dana (disbursement) yang pluggable.
// Provider default: "manual" (admin transfer sendiri). Set env DISBURSEMENT_PROVIDER=flip
// + FLIP_SECRET_KEY untuk mengaktifkan pencairan otomatis via Flip (bigflip.id).
//
// Desain sengaja provider-agnostic: menambah Xendit/Midtrans Iris cukup menambah satu cabang.

export type DisburseInput = {
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  ref: string; // id withdrawal internal (idempotency)
};

export type DisburseResult = {
  ok: boolean;
  provider: string;
  providerRef?: string;
  status?: "PROCESSING" | "PAID" | "FAILED";
  error?: string;
};

export function disbursementProvider(): string {
  return (process.env.DISBURSEMENT_PROVIDER || "manual").toLowerCase();
}

export function autoPayoutEnabled(): boolean {
  return disbursementProvider() !== "manual";
}

// Peta nama bank bebas → kode bank Flip. Kembalikan null bila tak dikenali
// (auto-payout dibatalkan, jatuh ke proses manual).
const FLIP_BANK_CODES: Record<string, string> = {
  bca: "bca", "bank central asia": "bca",
  bri: "bri", "bank rakyat indonesia": "bri",
  bni: "bni", "bank negara indonesia": "bni",
  mandiri: "mandiri", "bank mandiri": "mandiri",
  bsi: "bsi", "bank syariah indonesia": "bsi",
  cimb: "cimb", "cimb niaga": "cimb",
  permata: "permata", "bank permata": "permata",
  danamon: "danamon", btn: "btn", "bank btn": "btn",
  mega: "mega", "bank mega": "mega", panin: "panin",
  ocbc: "ocbc", "ocbc nisp": "ocbc",
  gopay: "gopay", ovo: "ovo", dana: "dana", shopeepay: "shopeepay", linkaja: "linkaja",
  jago: "jago", "bank jago": "jago", seabank: "seabank", "bank neo": "neo_commerce", blu: "blu",
};

export function resolveBankCode(bankName: string): string | null {
  const key = bankName.trim().toLowerCase();
  if (FLIP_BANK_CODES[key]) return FLIP_BANK_CODES[key];
  // Coba cocokkan sebagian (mis. "BCA Syariah" → cari token pertama yang dikenal).
  for (const [name, code] of Object.entries(FLIP_BANK_CODES)) {
    if (key.includes(name)) return code;
  }
  return null;
}

// Buat pencairan. Bila provider "manual" atau kredensial belum ada, kembalikan ok:false
// tanpa error keras (biar alur manual tetap jalan).
export async function createDisbursement(input: DisburseInput): Promise<DisburseResult> {
  const provider = disbursementProvider();
  if (provider === "flip") return flipDisburse(input);
  return { ok: false, provider: "manual" };
}

async function flipDisburse(input: DisburseInput): Promise<DisburseResult> {
  const key = process.env.FLIP_SECRET_KEY;
  if (!key) return { ok: false, provider: "flip", error: "FLIP_SECRET_KEY belum diset" };
  const bankCode = resolveBankCode(input.bankName);
  if (!bankCode) return { ok: false, provider: "flip", error: `Bank "${input.bankName}" tidak dikenali untuk auto-payout` };

  const base = process.env.FLIP_BASE_URL || "https://bigflip.id/api";
  const body = new URLSearchParams({
    account_number: input.accountNumber,
    bank_code: bankCode,
    amount: String(input.amount),
    remark: `NuswaMart payout ${input.ref}`.slice(0, 30),
  });

  try {
    const res = await fetch(`${base}/v2/disbursement`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "idempotency-key": input.ref,
      },
      body,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, provider: "flip", error: data?.message || `HTTP ${res.status}` };
    }
    // Flip: status DONE = sudah cair, PENDING = diproses, CANCELLED = gagal.
    const st = String(data?.status || "").toUpperCase();
    const status = st === "DONE" ? "PAID" : st === "CANCELLED" ? "FAILED" : "PROCESSING";
    return { ok: status !== "FAILED", provider: "flip", providerRef: String(data?.id ?? ""), status };
  } catch (e) {
    return { ok: false, provider: "flip", error: e instanceof Error ? e.message : "network error" };
  }
}

// Peta status callback provider → status internal Withdrawal.
export function mapDisbursementStatus(raw: string): "PAID" | "FAILED" | "PROCESSING" {
  const s = raw.toUpperCase();
  if (["DONE", "SUCCESS", "COMPLETED", "PAID"].includes(s)) return "PAID";
  if (["CANCELLED", "FAILED", "REJECTED", "REVERSED"].includes(s)) return "FAILED";
  return "PROCESSING";
}
