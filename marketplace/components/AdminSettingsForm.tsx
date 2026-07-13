"use client";

import { useActionState } from "react";
import { updateSettingsAction } from "@/app/actions/admin";
import AiModelPicker from "@/components/admin/AiModelPicker";

type AiConfig = { apiKeySet: boolean; baseUrl: string; model: string };

export default function AdminSettingsForm({
  currentFee,
  imageConfig,
  captionConfig,
}: {
  currentFee: number;
  imageConfig: AiConfig;
  captionConfig: AiConfig;
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
          Generate foto dan generate caption punya API key, base URL, dan model masing-masing — jadi
          bisa pakai provider/model berbeda untuk tiap fitur. Kuota gratis 10x/bulan per seller,
          100x/bulan untuk seller Pro. Akses per-toko diatur di{" "}
          <a href="/admin/ai-usage" className="text-teal-600 hover:underline">AI Studio (admin)</a>.
        </p>

        <div className="grid lg:grid-cols-2 gap-6">
          <AiModelPicker
            title="🖼️ Generate Foto"
            apiKeyName="aiImageApiKey"
            baseUrlName="aiImageBaseUrl"
            modelName="aiImageModel"
            apiKeySet={imageConfig.apiKeySet}
            defaultBaseUrl={imageConfig.baseUrl}
            defaultModel={imageConfig.model}
            placeholderBaseUrl="https://api.kie.ai"
            placeholderModel="google/nano-banana-edit"
            helpText={
              <>
                Dipakai untuk generate variasi foto produk dari 1 foto HP. Default: kie.ai, model{" "}
                <code>google/nano-banana-edit</code>.
              </>
            }
          />
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
                Dipakai untuk generate 3 pilihan caption/deskripsi produk. Default: kie.ai, model{" "}
                <code>gemini-2.5-flash</code>.
              </>
            }
          />
        </div>
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
