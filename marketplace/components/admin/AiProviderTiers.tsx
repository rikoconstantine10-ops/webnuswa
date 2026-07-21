"use client";

import AiModelPicker from "./AiModelPicker";

type Tier = { apiKeySet: boolean; baseUrl: string; model: string };

const TIER_LABELS = ["Provider Utama", "Cadangan 1", "Cadangan 2"];

// Tiga slot provider (Utama → Cadangan 1 → Cadangan 2) untuk satu fungsi AI (Foto/Video/
// Chatbot). Kalau Utama gagal/timeout, sistem otomatis coba Cadangan 1, lalu Cadangan 2.
export default function AiProviderTiers({
  title,
  fieldPrefix,
  tiers,
  placeholderBaseUrl,
  placeholderModel,
  helpText,
}: {
  title: string;
  fieldPrefix: string;
  tiers: Tier[];
  placeholderBaseUrl: string;
  placeholderModel: string;
  helpText: React.ReactNode;
}) {
  return (
    <div className="space-y-4 border border-slate-200 rounded-xl p-4">
      <p className="text-sm font-bold text-slate-800">{title}</p>
      <p className="text-xs text-slate-500">{helpText}</p>
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className={i > 0 ? "pt-4 border-t border-dashed border-slate-200" : ""}>
            <AiModelPicker
              title={TIER_LABELS[i]}
              apiKeyName={`${fieldPrefix}ApiKey${i}`}
              baseUrlName={`${fieldPrefix}BaseUrl${i}`}
              modelName={`${fieldPrefix}Model${i}`}
              apiKeySet={tiers[i]?.apiKeySet ?? false}
              defaultBaseUrl={tiers[i]?.baseUrl || (i === 0 ? placeholderBaseUrl : "")}
              defaultModel={tiers[i]?.model || ""}
              placeholderBaseUrl={placeholderBaseUrl}
              placeholderModel={placeholderModel}
              helpText={i === 0 ? "Dicoba lebih dulu." : "Dicoba kalau slot di atasnya gagal/timeout. Boleh dikosongkan."}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
