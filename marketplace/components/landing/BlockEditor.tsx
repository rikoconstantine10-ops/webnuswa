"use client";

import { useState } from "react";
import type { LandingBlockType } from "@/lib/landingBlocks";

type Addon = { id: string; name: string };
// Draft longgar (any-shaped) — validasi ketat sesungguhnya terjadi di server via zod
// (landingBlockSchema.parse) sebelum disimpan, jadi state form di sini boleh santai.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Draft = Record<string, any>;

async function uploadImage(e: React.ChangeEvent<HTMLInputElement>, set: (u: string) => void, setUploading: (b: boolean) => void) {
  const file = e.target.files?.[0];
  if (!file) return;
  setUploading(true);
  try {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload?kind=image", { method: "POST", body: fd });
    const json = await res.json();
    if (res.ok) set(json.url);
  } finally {
    setUploading(false);
  }
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5">{label}</label>
      <input type="file" accept="image/*" onChange={(e) => uploadImage(e, onChange, setUploading)} className="w-full text-sm border border-dashed border-slate-300 rounded-lg px-3 py-2" />
      {uploading && <p className="text-xs text-slate-400 mt-1">Mengunggah…</p>}
      {value && !uploading && <p className="text-xs text-teal-600 mt-1">Gambar terunggah ✓</p>}
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5">{label}</label>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
    </div>
  );
}

function TextArea({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5">{label}</label>
      <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} required={required} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
    </div>
  );
}

function ListEditor<T>({
  label,
  items,
  onChange,
  newItem,
  renderRow,
  min = 1,
  max = 10,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  newItem: () => T;
  renderRow: (item: T, update: (patch: Partial<T>) => void) => React.ReactNode;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-lg p-2.5">
            <div className="flex-1 space-y-1.5">
              {renderRow(item, (patch) => {
                const next = [...items];
                next[i] = { ...next[i], ...patch };
                onChange(next);
              })}
            </div>
            <button type="button" disabled={items.length <= min} onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 disabled:opacity-25 px-1">
              ×
            </button>
          </div>
        ))}
      </div>
      <button type="button" disabled={items.length >= max} onClick={() => onChange([...items, newItem()])} className="mt-2 text-xs font-bold text-teal-600 hover:underline disabled:opacity-40">
        + Tambah
      </button>
    </div>
  );
}

export default function BlockEditor({ type, draft, setDraft, addons }: { type: LandingBlockType; draft: Draft; setDraft: (d: Draft) => void; addons: Addon[] }) {
  const set = (patch: Draft) => setDraft({ ...draft, ...patch });

  switch (type) {
    case "hero":
      return (
        <div className="space-y-3">
          <TextInput label="Judul" value={draft.heading} onChange={(v) => set({ heading: v })} required placeholder="Judul menarik produkmu" />
          <TextInput label="Sub-judul (opsional)" value={draft.subheading} onChange={(v) => set({ subheading: v })} />
          <ImageField label="Gambar hero" value={draft.imageUrl} onChange={(v) => set({ imageUrl: v })} />
          <TextInput label="Label tombol CTA (opsional)" value={draft.ctaLabel} onChange={(v) => set({ ctaLabel: v })} placeholder="Lihat Penawaran" />
        </div>
      );
    case "product_info":
      return <p className="text-sm text-slate-500">Nama, harga, rating, & jumlah terjual produk tampil otomatis — tidak ada yang perlu diatur.</p>;
    case "media_text":
      return (
        <div className="space-y-3">
          <TextInput label="Judul (opsional)" value={draft.heading} onChange={(v) => set({ heading: v })} />
          <TextArea label="Teks" value={draft.body} onChange={(v) => set({ body: v })} required />
          <ImageField label="Gambar" value={draft.imageUrl} onChange={(v) => set({ imageUrl: v })} />
          <div>
            <label className="text-sm font-medium block mb-1.5">Posisi gambar</label>
            <div className="flex gap-2">
              {(["left", "right"] as const).map((pos) => (
                <label key={pos} className="flex items-center gap-1.5 text-sm">
                  <input type="radio" checked={(draft.imagePosition ?? "left") === pos} onChange={() => set({ imagePosition: pos })} />
                  {pos === "left" ? "Kiri" : "Kanan"}
                </label>
              ))}
            </div>
          </div>
        </div>
      );
    case "benefits":
      return (
        <div className="space-y-3">
          <TextInput label="Judul" value={draft.heading} onChange={(v) => set({ heading: v })} required placeholder="Kenapa Pilih Produk Ini?" />
          <ListEditor
            label="Poin keunggulan"
            items={draft.items ?? []}
            onChange={(items) => set({ items })}
            newItem={() => ({ icon: "✅", text: "" })}
            max={8}
            renderRow={(item, update) => (
              <div className="flex gap-2">
                <input value={item.icon} onChange={(e) => update({ icon: e.target.value })} className="w-12 border border-slate-300 rounded-lg px-2 py-1.5 text-sm text-center" placeholder="✅" />
                <input value={item.text} onChange={(e) => update({ text: e.target.value })} className="flex-1 border border-slate-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Keunggulan singkat" />
              </div>
            )}
          />
        </div>
      );
    case "steps":
      return (
        <div className="space-y-3">
          <TextInput label="Judul" value={draft.heading} onChange={(v) => set({ heading: v })} required placeholder="Cara Pesan" />
          <ListEditor
            label="Langkah"
            items={draft.items ?? []}
            onChange={(items) => set({ items })}
            newItem={() => ({ title: "", desc: "" })}
            max={6}
            renderRow={(item, update) => (
              <div className="space-y-1">
                <input value={item.title} onChange={(e) => update({ title: e.target.value })} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Judul langkah" />
                <input value={item.desc ?? ""} onChange={(e) => update({ desc: e.target.value })} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Detail (opsional)" />
              </div>
            )}
          />
        </div>
      );
    case "trust_badges":
      return (
        <ListEditor
          label="Badge kepercayaan"
          items={(draft.items ?? []).map((t: string) => ({ text: t }))}
          onChange={(items) => set({ items: items.map((i: { text: string }) => i.text) })}
          newItem={() => ({ text: "" })}
          max={6}
          renderRow={(item, update) => (
            <input value={item.text} onChange={(e) => update({ text: e.target.value })} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm" placeholder="mis. 100% Original" />
          )}
        />
      );
    case "countdown":
      return (
        <div className="space-y-3">
          <TextInput label="Judul (opsional)" value={draft.heading} onChange={(v) => set({ heading: v })} placeholder="Promo berakhir dalam:" />
          <div>
            <label className="text-sm font-medium block mb-1.5">Berakhir pada</label>
            <input
              type="datetime-local"
              value={draft.endAt ? new Date(draft.endAt).toISOString().slice(0, 16) : ""}
              onChange={(e) => set({ endAt: new Date(e.target.value).toISOString() })}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <TextInput label="Teks setelah berakhir (opsional)" value={draft.expiredText} onChange={(v) => set({ expiredText: v })} placeholder="Promo sudah berakhir" />
        </div>
      );
    case "divider":
      return <p className="text-sm text-slate-500">Garis pemisah sederhana — tidak ada yang perlu diatur.</p>;
    case "text":
      return (
        <div className="space-y-3">
          <TextInput label="Judul (opsional)" value={draft.heading} onChange={(v) => set({ heading: v })} />
          <TextArea label="Isi teks" value={draft.body} onChange={(v) => set({ body: v })} required />
        </div>
      );
    case "faq":
      return (
        <div className="space-y-3">
          <TextInput label="Judul" value={draft.heading} onChange={(v) => set({ heading: v })} required placeholder="Pertanyaan Umum" />
          <ListEditor
            label="Tanya-jawab"
            items={draft.items ?? []}
            onChange={(items) => set({ items })}
            newItem={() => ({ question: "", answer: "" })}
            max={10}
            renderRow={(item, update) => (
              <div className="space-y-1">
                <input value={item.question} onChange={(e) => update({ question: e.target.value })} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Pertanyaan" />
                <textarea value={item.answer} onChange={(e) => update({ answer: e.target.value })} rows={2} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Jawaban" />
              </div>
            )}
          />
        </div>
      );
    case "testimonials":
      return (
        <div className="space-y-3">
          <TextInput label="Judul" value={draft.heading} onChange={(v) => set({ heading: v })} required placeholder="Kata Pelanggan Kami" />
          <ListEditor
            label="Testimoni"
            items={draft.items ?? []}
            onChange={(items) => set({ items })}
            newItem={() => ({ name: "", quote: "", rating: 5 })}
            max={6}
            renderRow={(item, update) => (
              <div className="space-y-1">
                <input value={item.name} onChange={(e) => update({ name: e.target.value })} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Nama pelanggan" />
                <textarea value={item.quote} onChange={(e) => update({ quote: e.target.value })} rows={2} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Kutipan testimoni" />
                <select value={item.rating ?? 5} onChange={(e) => update({ rating: parseInt(e.target.value, 10) })} className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm">
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"⭐".repeat(n)}</option>)}
                </select>
              </div>
            )}
          />
        </div>
      );
    case "gallery":
      return (
        <div className="space-y-3">
          <TextInput label="Judul (opsional)" value={draft.heading} onChange={(v) => set({ heading: v })} />
          <ListEditor
            label="Foto"
            items={(draft.images ?? []).map((u: string) => ({ url: u }))}
            onChange={(items) => set({ images: items.map((i: { url: string }) => i.url) })}
            newItem={() => ({ url: "" })}
            max={10}
            renderRow={(item, update) => <ImageField label="" value={item.url} onChange={(v) => update({ url: v })} />}
          />
        </div>
      );
    case "video":
      return (
        <div className="space-y-3">
          <TextInput label="Judul (opsional)" value={draft.heading} onChange={(v) => set({ heading: v })} />
          <TextInput label="Link video (YouTube atau MP4)" value={draft.videoUrl} onChange={(v) => set({ videoUrl: v })} required placeholder="https://youtube.com/watch?v=..." />
        </div>
      );
    case "whatsapp_cta":
      return (
        <div className="space-y-3">
          <TextInput label="Judul (opsional)" value={draft.heading} onChange={(v) => set({ heading: v })} />
          <TextInput label="Label tombol" value={draft.buttonLabel} onChange={(v) => set({ buttonLabel: v })} required placeholder="Chat Admin via WhatsApp" />
          <TextInput label="Template pesan (opsional)" value={draft.messageTemplate} onChange={(v) => set({ messageTemplate: v })} placeholder="Halo, saya tertarik dengan produk ini" />
        </div>
      );
    case "social_links":
      return (
        <ListEditor
          label="Media sosial"
          items={draft.items ?? []}
          onChange={(items) => set({ items })}
          newItem={() => ({ platform: "instagram", url: "" })}
          max={4}
          renderRow={(item, update) => (
            <div className="flex gap-2">
              <select value={item.platform} onChange={(e) => update({ platform: e.target.value })} className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm">
                {["instagram", "tiktok", "facebook", "youtube"].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <input value={item.url} onChange={(e) => update({ url: e.target.value })} className="flex-1 border border-slate-300 rounded-lg px-2 py-1.5 text-sm" placeholder="https://..." />
            </div>
          )}
        />
      );
    case "pricing_plans":
      return (
        <div className="space-y-3">
          <TextInput label="Judul (opsional)" value={draft.heading} onChange={(v) => set({ heading: v })} placeholder="Paket Harga" />
          <p className="text-xs text-slate-400">Isi paket diambil otomatis dari harga grosir yang sudah diatur di halaman produk.</p>
        </div>
      );
    case "order_form":
      return (
        <div className="space-y-3">
          <TextInput label="Judul (opsional)" value={draft.heading} onChange={(v) => set({ heading: v })} placeholder="Pesan Sekarang" />
          {addons.length > 0 && (
            <div>
              <label className="text-sm font-medium block mb-1.5">Add-on yang ditampilkan (opsional)</label>
              <div className="space-y-1">
                {addons.map((a) => {
                  const checked: string[] = draft.addonIds ?? [];
                  return (
                    <label key={a.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked.includes(a.id)}
                        onChange={(e) => set({ addonIds: e.target.checked ? [...checked, a.id] : checked.filter((id) => id !== a.id) })}
                      />
                      {a.name}
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 mt-1">Add-on diatur lengkap (harga spesial) di halaman Produk → Add-on.</p>
            </div>
          )}
        </div>
      );
  }
}
