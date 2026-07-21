"use client";

import { useActionState } from "react";
import { updateSettingsAction } from "@/app/actions/admin";
import AiModelPicker from "@/components/admin/AiModelPicker";
import AiProviderTiers from "@/components/admin/AiProviderTiers";

type AiConfig = { apiKeySet: boolean; baseUrl: string; model: string };
type Tier = AiConfig;

export default function AdminSettingsForm({
  currentFee,
  captionConfig,
  voiceConfig,
  imageTiers,
  videoTiers,
  chatTiers,
  globalSystemPrompt,
}: {
  currentFee: number;
  captionConfig: AiConfig;
  voiceConfig: AiConfig;
  imageTiers: Tier[];
  videoTiers: Tier[];
  chatTiers: Tier[];
  globalSystemPrompt: string;
}) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, {});

  return (
    <form action={formAction} className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 p-6 space-y-6 max-w-3xl">
      <div>
        <label className="text-sm font-medium block mb-1">Platform fee (%)</label>
        <input
          type="number"
          name="platformFeePercent"
          step="0.1"
          min={0}
          max={50}
          defaultValue={currentFee}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <p className="text-xs text-slate-500 mt-1">
          Dipotong dari subtotal tiap order yang lunas. Ongkir tidak dipotong fee.
        </p>
      </div>

      <hr className="border-slate-100" />

      <div>
        <p className="text-base font-bold mb-1">✨ Fitur AI Studio Seller</p>
        <p className="text-xs text-slate-500 mb-4">
          Generate foto, video, dan caption punya API key, base URL, dan model masing-masing — jadi
          bisa pakai provider/model berbeda untuk tiap fitur. Kuota gratis 10x/bulan per seller,
          100x/bulan untuk seller Pro. Akses per-toko diatur di{" "}
          <a href="/admin/ai-usage" className="text-teal-600 hover:underline">AI Studio (admin)</a>.
        </p>

        <div className="space-y-5">
          <AiProviderTiers
            title="🖼️ Generate Foto"
            fieldPrefix="aiImageTier"
            tiers={imageTiers}
            placeholderBaseUrl="https://api.kie.ai"
            placeholderModel="google/nano-banana-edit"
            helpText={
              <>
                Dipakai untuk generate 4 variasi foto studio dari 1 foto HP. Default: kie.ai, model{" "}
                <code>google/nano-banana-edit</code>. Punya 3 slot provider dengan fallback otomatis.
              </>
            }
          />
          <AiProviderTiers
            title="🎬 Generate Video"
            fieldPrefix="aiVideoTier"
            tiers={videoTiers}
            placeholderBaseUrl="https://api.kie.ai"
            placeholderModel="isi model video sesuai provider"
            helpText={<>Dipakai untuk generate 1 video showcase produk dari 1 foto HP. Punya 3 slot provider dengan fallback otomatis.</>}
          />
          <AiProviderTiers
            title="🤖 Chatbot WA"
            fieldPrefix="aiChatTier"
            tiers={chatTiers}
            placeholderBaseUrl="https://api.kie.ai"
            placeholderModel="isi model chat sesuai provider"
            helpText={<>Dipakai untuk otak balasan chatbot WhatsApp. Punya 3 slot provider dengan fallback otomatis.</>}
          />

          <div className="grid lg:grid-cols-2 gap-6">
            <AiModelPicker
              title="📝 Generate Caption"
              apiKeyName="aiCaptionApiKey"
              baseUrlName="aiCaptionBaseUrl"
              modelName="aiCaptionModel"
              apiKeySet={captionConfig.apiKeySet}
              defaultBaseUrl={captionConfig.baseUrl}
              defaultModel={captionConfig.model}
              placeholderBaseUrl="https://api.kie.ai"
              placeholderModel="gemini-2.5-flash"
              helpText={
                <>
                  Dipakai untuk generate 3 pilihan caption/deskripsi produk (sosmed atau iklan). Default: kie.ai, model{" "}
                  <code>gemini-2.5-flash</code>.
                </>
              }
            />
            <AiModelPicker
              title="🎙️ Transkrip Suara"
              apiKeyName="aiVoiceApiKey"
              baseUrlName="aiVoiceBaseUrl"
              modelName="aiVoiceModel"
              apiKeySet={voiceConfig.apiKeySet}
              defaultBaseUrl={voiceConfig.baseUrl}
              defaultModel={voiceConfig.model}
              placeholderBaseUrl="https://api.kie.ai"
              placeholderModel="whisper-1"
              helpText={<>Dipakai untuk transkrip voice note pembeli di chatbot WA jadi teks.</>}
            />
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      <div>
        <p className="text-base font-bold mb-1">🤖 Global System Prompt — Chatbot WA</p>
        <p className="text-xs text-slate-500 mb-3">
          Aturan keras yang berlaku untuk <b>semua</b> bot toko, tidak bisa ditimpa persona seller: larangan
          mengarang harga/stok, kewajiban pakai data katalog/order yang disuntikkan sistem, aturan eskalasi
          ke manusia. Persona/kepribadian tiap toko diatur seller sendiri di halaman WhatsApp Toko.
        </p>
        <textarea
          name="waGlobalSystemPrompt"
          rows={6}
          defaultValue={globalSystemPrompt}
          placeholder={
            "Contoh: Kamu adalah asisten toko online. HANYA jawab pertanyaan menggunakan data katalog/order yang " +
            "diberikan di konteks. JANGAN PERNAH mengarang harga, stok, atau janji pengiriman. Jika data tidak " +
            "tersedia atau kamu tidak yakin, katakan akan diteruskan ke penjual, jangan menebak."
          }
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state.saved && (
        <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">✓ Tersimpan</p>
      )}
      <button
        disabled={pending}
        className="bg-teal-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-teal-700 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}
