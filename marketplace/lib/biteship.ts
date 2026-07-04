// Klien Biteship — cek ongkir (rates), pencarian area (maps), dan (Fase 2) order + tracking.
// Auth: header Authorization berisi token langsung (tanpa "Bearer").
// Docs: https://biteship.com/id/docs

const BASE = process.env.BITESHIP_API_URL || "https://api.biteship.com";
const KEY = process.env.BITESHIP_API_KEY || "";

export type BiteshipArea = {
  id: string;
  name: string;
  postal_code: number;
};

export type BiteshipRate = {
  courier_name: string;
  courier_code: string; // company, mis. "jne"
  courier_service_name: string; // mis. "Reguler"
  courier_service_code: string; // type, mis. "reg"
  price: number;
  duration?: string;
  shipment_duration_range?: string;
  shipment_duration_unit?: string;
};

type BiteshipResponse = {
  success?: boolean;
  error?: string;
  areas?: { id: string; name: string; postal_code: number }[];
  pricing?: BiteshipRate[];
  [k: string]: unknown;
};

async function call(path: string, init?: RequestInit): Promise<BiteshipResponse> {
  if (!KEY) return { success: false, error: "BITESHIP_API_KEY belum diset" };
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: KEY, ...init?.headers },
      signal: AbortSignal.timeout(20000),
    });
    return (await res.json()) as BiteshipResponse;
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "network error" };
  }
}

export async function searchAreas(input: string): Promise<BiteshipArea[]> {
  if (input.trim().length < 3) return [];
  const q = encodeURIComponent(input.trim());
  const data = await call(`/v1/maps/areas?countries=ID&input=${q}&type=single`);
  if (!data.success) return [];
  return (data.areas ?? []).map((a) => ({ id: a.id, name: a.name, postal_code: a.postal_code }));
}

export type RatesInput = {
  originAreaId?: string;
  originPostalCode?: string | number;
  destinationAreaId?: string;
  destinationPostalCode?: string | number;
  couriers?: string; // "jne,jnt,sicepat,..."
  items: { name: string; value: number; weight: number; quantity: number; length?: number; width?: number; height?: number }[];
};

export async function getRates(
  input: RatesInput
): Promise<{ success: boolean; error?: string; pricing: BiteshipRate[] }> {
  const body: Record<string, unknown> = {
    couriers: input.couriers || "jne,jnt,sicepat,anteraja,ninja,pos,ide,lion,wahana",
    items: input.items,
  };
  if (input.originAreaId) body.origin_area_id = input.originAreaId;
  else if (input.originPostalCode) body.origin_postal_code = Number(input.originPostalCode);
  if (input.destinationAreaId) body.destination_area_id = input.destinationAreaId;
  else if (input.destinationPostalCode) body.destination_postal_code = Number(input.destinationPostalCode);

  const data = await call("/v1/rates/couriers", { method: "POST", body: JSON.stringify(body) });
  if (!data.success) return { success: false, error: data.error || "gagal cek ongkir", pricing: [] };
  return { success: true, pricing: data.pricing ?? [] };
}
