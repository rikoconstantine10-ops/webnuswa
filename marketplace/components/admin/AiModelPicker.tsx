"use client";

import { useId, useState } from "react";

export default function AiModelPicker({
  title,
  apiKeyName,
  baseUrlName,
  modelName,
  apiKeySet,
  defaultBaseUrl,
  defaultModel,
  placeholderBaseUrl,
  placeholderModel,
  helpText,
}: {
  title: string;
  apiKeyName: string;
  baseUrlName: string;
  modelName: string;
  apiKeySet: boolean;
  defaultBaseUrl: string;
  defaultModel: string;
  placeholderBaseUrl: string;
  placeholderModel: string;
  helpText: React.ReactNode;
}) {
  const listId = useId();
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl);
  const [model, setModel] = useState(defaultModel);
  const [models, setModels] = useState<string[]>([]);
  const [status, setStatus] = useState<{ kind: "idle" | "loading" | "error" | "ok"; message?: string }>({ kind: "idle" });

  async function fetchModels() {
    if (!apiKey.trim() || !baseUrl.trim()) return;
    setStatus({ kind: "loading" });
    try {
      const res = await fetch("/api/admin/ai-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, baseUrl }),
      });
      const json = await res.json();
      if (json.ok) {
        setModels(json.models);
        setStatus({ kind: "ok", message: `${json.models.length} model ditemukan — pilih dari saran di kolom Model.` });
      } else {
        setStatus({ kind: "error", message: json.error });
      }
    } catch {
      setStatus({ kind: "error", message: "Gagal menghubungi provider." });
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-slate-800">{title}</p>

      <div>
        <label className="text-xs font-medium text-slate-500 block mb-1">
          API Key {apiKeySet && <span className="text-emerald-600 font-normal">(sudah diatur)</span>}
        </label>
        <input
          type="password"
          name={apiKeyName}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={apiKeySet ? "•••••••••••••••• (kosongkan jika tidak diubah)" : "Tempel API key"}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 block mb-1">Base URL</label>
        <input
          type="text"
          name={baseUrlName}
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder={placeholderBaseUrl}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 block mb-1">Model</label>
        <input
          type="text"
          name={modelName}
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={placeholderModel}
          list={models.length > 0 ? listId : undefined}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"
        />
        <button
          type="button"
          onClick={fetchModels}
          disabled={!apiKey.trim() || !baseUrl.trim() || status.kind === "loading"}
          className="mt-2 w-full sm:w-auto text-xs font-bold px-3 py-1.5 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status.kind === "loading" ? "Mengambil..." : "🔄 Ambil Daftar Model"}
        </button>
        {models.length > 0 && (
          <datalist id={listId}>
            {models.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        )}
        {status.kind === "error" && <p className="text-xs text-amber-600 mt-1">{status.message}</p>}
        {status.kind === "ok" && <p className="text-xs text-emerald-600 mt-1">{status.message}</p>}
        {status.kind === "idle" && !apiKey.trim() && apiKeySet && (
          <p className="text-xs text-slate-400 mt-1">Isi ulang API key di atas untuk bisa fetch daftar model.</p>
        )}
      </div>

      <p className="text-xs text-slate-500">{helpText}</p>
    </div>
  );
}
