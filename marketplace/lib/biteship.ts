// Klien Biteship — cek ongkir (rates), pencarian area (maps), dan (Fase 2) order + tracking.
// Auth: header Authorization berisi token langsung (tanpa "Bearer").
// Docs: https://biteship.com/id/docs

const BASE = process.env.BITESHIP_API_URL || "https://api.biteship.com";
const KEY = process.env.BITESHIP_API_KEY || "";

// Kurir reguler/ekspedisi (pakai area_id kecamatan). Kode sesuai Biteship /v1/couriers.
export const REGULAR_COURIERS = "jne,jnt,sicepat,anteraja,idexpress,ninja,pos,tiki,lion,wahana,sap,rpx";
// Kurir instan/on-demand (butuh titik koordinat lat/long, bukan area_id).
export const INSTANT_COURIERS = "gojek,grab,lalamove";
// Kode kurir yang tergolong instan — dipakai untuk cek apakah suatu order butuh koordinat.
export const INSTANT_COURIER_CODES = new Set(["gojek", "grab", "lalamove", "borzo", "deliveree", "paxel"]);
const DEFAULT_COURIERS = REGULAR_COURIERS;

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
  available_for_cash_on_delivery?: boolean;
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
  originLatitude?: number;
  originLongitude?: number;
  destinationAreaId?: string;
  destinationPostalCode?: string | number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  couriers?: string; // "jne,jnt,sicepat,..."
  items: { name: string; value: number; weight: number; quantity: number; length?: number; width?: number; height?: number }[];
};

export async function getRates(
  input: RatesInput
): Promise<{ success: boolean; error?: string; pricing: BiteshipRate[] }> {
  const body: Record<string, unknown> = {
    couriers: input.couriers || DEFAULT_COURIERS,
    items: input.items,
  };
  // Koordinat & area boleh dikirim bersamaan: Biteship pakai area_id untuk kurir reguler
  // dan lat/long untuk kurir instan, lalu mengembalikan keduanya dalam satu respons.
  if (input.originAreaId) body.origin_area_id = input.originAreaId;
  else if (input.originPostalCode) body.origin_postal_code = Number(input.originPostalCode);
  if (typeof input.originLatitude === "number" && typeof input.originLongitude === "number") {
    body.origin_latitude = input.originLatitude;
    body.origin_longitude = input.originLongitude;
  }
  if (input.destinationAreaId) body.destination_area_id = input.destinationAreaId;
  else if (input.destinationPostalCode) body.destination_postal_code = Number(input.destinationPostalCode);
  if (typeof input.destinationLatitude === "number" && typeof input.destinationLongitude === "number") {
    body.destination_latitude = input.destinationLatitude;
    body.destination_longitude = input.destinationLongitude;
  }

  const data = await call("/v1/rates/couriers", { method: "POST", body: JSON.stringify(body) });
  if (!data.success) return { success: false, error: data.error || "gagal cek ongkir", pricing: [] };
  return { success: true, pricing: data.pricing ?? [] };
}

export type CreateOrderInput = {
  origin: { contactName: string; contactPhone: string; address: string; areaId?: string; postalCode?: string | number; lat?: number; lng?: number };
  destination: { contactName: string; contactPhone: string; address: string; areaId?: string; postalCode?: string | number; lat?: number; lng?: number };
  courierCompany: string;
  courierType: string;
  orderNote?: string;
  items: { name: string; value: number; weight: number; quantity: number }[];
  isInstant?: boolean;
  codAmount?: number; // > 0 = order COD (tagih tunai ke penerima)
};

// Buat order pengiriman di Biteship (menjadwalkan penjemputan kurir).
export async function createBiteshipOrder(
  input: CreateOrderInput
): Promise<{ success: boolean; error?: string; orderId?: string; waybill?: string; trackingId?: string; status?: string }> {
  const now = new Date();
  const body: Record<string, unknown> = {
    shipper_contact_name: input.origin.contactName,
    shipper_contact_phone: input.origin.contactPhone,
    origin_contact_name: input.origin.contactName,
    origin_contact_phone: input.origin.contactPhone,
    origin_address: input.origin.address,
    destination_contact_name: input.destination.contactName,
    destination_contact_phone: input.destination.contactPhone,
    destination_address: input.destination.address,
    courier_company: input.courierCompany,
    courier_type: input.courierType,
    courier_insurance: 0,
    delivery_type: "now",
    delivery_date: now.toISOString().slice(0, 10),
    delivery_time: `${String(now.getHours()).padStart(2, "0")}:00`,
    order_note: input.orderNote || "",
    items: input.items,
  };
  if (input.origin.areaId) body.origin_area_id = input.origin.areaId;
  else if (input.origin.postalCode) body.origin_postal_code = Number(input.origin.postalCode);
  if (input.destination.areaId) body.destination_area_id = input.destination.areaId;
  else if (input.destination.postalCode) body.destination_postal_code = Number(input.destination.postalCode);
  if (input.codAmount && input.codAmount > 0) {
    body.destination_cash_on_delivery = input.codAmount;
    body.destination_cash_on_delivery_type = "3_days";
  }
  if (input.isInstant) {
    if (input.origin.lat != null && input.origin.lng != null) {
      body.origin_coordinate = { latitude: input.origin.lat, longitude: input.origin.lng };
    }
    if (input.destination.lat != null && input.destination.lng != null) {
      body.destination_coordinate = { latitude: input.destination.lat, longitude: input.destination.lng };
    }
  }
  const data = await call("/v1/orders", { method: "POST", body: JSON.stringify(body) });
  if (!data.success && data.success !== undefined) {
    return { success: false, error: data.error || "gagal membuat order kurir" };
  }
  const courier = (data.courier ?? {}) as Record<string, unknown>;
  return {
    success: true,
    orderId: String(data.id ?? ""),
    waybill: courier.waybill_id ? String(courier.waybill_id) : undefined,
    trackingId: courier.tracking_id ? String(courier.tracking_id) : undefined,
    status: data.status ? String(data.status) : undefined,
  };
}

// Ambil status tracking terkini order Biteship.
export async function getBiteshipOrder(
  orderId: string
): Promise<{ success: boolean; status?: string; waybill?: string; error?: string }> {
  const data = await call(`/v1/orders/${orderId}`);
  if (data.success === false) return { success: false, error: data.error };
  const courier = (data.courier ?? {}) as Record<string, unknown>;
  return { success: true, status: data.status ? String(data.status) : undefined, waybill: courier.waybill_id ? String(courier.waybill_id) : undefined };
}
