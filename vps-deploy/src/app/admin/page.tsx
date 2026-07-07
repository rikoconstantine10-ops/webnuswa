"use client";

import { useState, useEffect, useCallback } from "react";

const CATEGORIES = [
  "Digital Marketing", "SEO", "Google Ads", "Social Media Marketing",
  "Content Marketing", "Email Marketing", "E-commerce",
];

const INTENTS = ["informational", "transactional", "navigational", "commercial"];

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  done:      "bg-green-100 text-green-800",
  error:     "bg-red-100 text-red-800",
  published: "bg-green-100 text-green-800",
  draft:     "bg-gray-100 text-gray-700",
  queued:    "bg-blue-100 text-blue-800",
};

function ScoreBadge({ label, value }: { label: string; value: number | null }) {
  if (value == null) return <span className="text-gray-400 text-xs">—</span>;
  const color = value >= 70 ? "text-green-600" : value >= 40 ? "text-yellow-600" : "text-red-500";
  return (
    <span className={`text-xs font-semibold ${color}`}>
      {label}: {value}
    </span>
  );
}

export default function AdminDashboard() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"keywords" | "articles" | "logs">("keywords");

  // Keywords state
  const [keywords, setKeywords] = useState<any[]>([]);
  const [kwLoading, setKwLoading] = useState(false);
  const [newKw, setNewKw] = useState("");
  const [newCat, setNewCat] = useState("Digital Marketing");
  const [newIntent, setNewIntent] = useState("informational");

  // Articles state
  const [articles, setArticles] = useState<any[]>([]);
  const [artTotal, setArtTotal] = useState(0);
  const [artPage, setArtPage] = useState(1);
  const [artLoading, setArtLoading] = useState(false);

  // Generate state
  const [genLoading, setGenLoading] = useState(false);
  const [genMsg, setGenMsg] = useState("");
  const [logs, setLogs] = useState("");
  const [dryRun, setDryRun] = useState(false);
  const [maxGen, setMaxGen] = useState(3);

  const headers = { "x-admin-token": token, "Content-Type": "application/json" };

  const loadKeywords = useCallback(async () => {
    setKwLoading(true);
    const res = await fetch("/api/admin/keywords", { headers });
    if (res.ok) setKeywords(await res.json());
    setKwLoading(false);
  }, [token]);

  const loadArticles = useCallback(async (page = 1) => {
    setArtLoading(true);
    const res = await fetch(`/api/admin/articles?page=${page}&limit=20`, { headers });
    if (res.ok) {
      const data = await res.json();
      setArticles(data.articles || []);
      setArtTotal(data.total || 0);
      setArtPage(page);
    }
    setArtLoading(false);
  }, [token]);

  const loadLogs = useCallback(async () => {
    const res = await fetch("/api/admin/generate", { headers });
    if (res.ok) {
      const data = await res.json();
      setLogs(data.log || "No logs yet.");
    }
  }, [token]);

  useEffect(() => {
    if (!authed) return;
    if (tab === "keywords") loadKeywords();
    if (tab === "articles") loadArticles(1);
    if (tab === "logs") loadLogs();
  }, [authed, tab]);

  async function login() {
    const res = await fetch("/api/admin/keywords", {
      headers: { "x-admin-token": token },
    });
    if (res.ok) { setAuthed(true); }
    else alert("Token salah.");
  }

  async function addKeyword() {
    if (!newKw.trim()) return;
    const res = await fetch("/api/admin/keywords", {
      method: "POST", headers,
      body: JSON.stringify({ action: "add", keyword: newKw, category: newCat, search_intent: newIntent }),
    });
    if (res.ok) { setNewKw(""); loadKeywords(); }
  }

  async function kwAction(action: string, index: number) {
    await fetch("/api/admin/keywords", {
      method: "POST", headers,
      body: JSON.stringify({ action, index }),
    });
    loadKeywords();
  }

  async function toggleArticle(id: number, currentStatus: string) {
    const next = currentStatus === "published" ? "draft" : "published";
    await fetch("/api/admin/articles", {
      method: "POST", headers,
      body: JSON.stringify({ action: "set_status", id, status: next }),
    });
    loadArticles(artPage);
  }

  async function deleteArticle(id: number) {
    if (!confirm("Hapus artikel ini?")) return;
    await fetch("/api/admin/articles", {
      method: "POST", headers,
      body: JSON.stringify({ action: "delete", id }),
    });
    loadArticles(artPage);
  }

  async function triggerGenerate() {
    setGenLoading(true);
    setGenMsg("");
    const res = await fetch("/api/admin/generate", {
      method: "POST", headers,
      body: JSON.stringify({ dry_run: dryRun, max: maxGen }),
    });
    const data = await res.json();
    setGenMsg(data.message || data.error || "Done");
    setGenLoading(false);
    setTimeout(() => loadLogs(), 3000);
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-gray-800 mb-6">Admin — Article Dashboard</h1>
          <input
            type="password"
            placeholder="Admin token"
            value={token}
            onChange={e => setToken(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={login}
            className="w-full bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700 transition"
          >
            Masuk
          </button>
        </div>
      </div>
    );
  }

  const pendingCount = keywords.filter(k => k.status === "pending").length;
  const doneCount = keywords.filter(k => k.status === "done").length;
  const errorCount = keywords.filter(k => k.status === "error").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Article Generator Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">Nuswa Lab — Content Management</p>
        </div>
        <button
          onClick={triggerGenerate}
          disabled={genLoading || pendingCount === 0}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          {genLoading ? "Generating…" : `▶ Generate (${pendingCount} pending)`}
        </button>
      </div>

      {/* Stats bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex gap-6 text-sm">
        <span className="text-gray-500">Keywords: <strong className="text-yellow-600">{pendingCount} pending</strong> · <strong className="text-green-600">{doneCount} done</strong> · <strong className="text-red-500">{errorCount} error</strong></span>
        <span className="text-gray-500">Artikel: <strong className="text-gray-900">{artTotal} total</strong></span>
      </div>

      {genMsg && (
        <div className="mx-6 mt-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-800">
          {genMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 pt-5">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
          {(["keywords", "articles", "logs"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${tab === t ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t === "keywords" ? "Keywords" : t === "articles" ? "Artikel" : "Logs"}
            </button>
          ))}
        </div>

        {/* KEYWORDS TAB */}
        {tab === "keywords" && (
          <div>
            {/* Add keyword form */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Tambah Keyword Baru</h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="contoh: google ads untuk bisnis makanan di malaysia"
                  value={newKw}
                  onChange={e => setNewKw(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addKeyword()}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={newCat}
                  onChange={e => setNewCat(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <select
                  value={newIntent}
                  onChange={e => setNewIntent(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  {INTENTS.map(i => <option key={i}>{i}</option>)}
                </select>
                <button
                  onClick={addKeyword}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition whitespace-nowrap"
                >
                  + Tambah
                </button>
              </div>
            </div>

            {/* Generate options */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} className="rounded" />
                Dry Run (test tanpa simpan)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                Max artikel:
                <input
                  type="number"
                  min={1} max={10}
                  value={maxGen}
                  onChange={e => setMaxGen(Number(e.target.value))}
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </label>
              <button
                onClick={() => kwAction("reset_all", 0)}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Reset semua ke pending
              </button>
            </div>

            {/* Keywords list */}
            {kwLoading ? (
              <div className="text-center py-10 text-gray-400 text-sm">Loading…</div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Keyword</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Kategori</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Intent</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {keywords.map((kw, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                        <td className="px-4 py-3 text-gray-800 font-medium max-w-xs">{kw.keyword}</td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{kw.category}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{kw.search_intent}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[kw.status] || "bg-gray-100 text-gray-600"}`}>
                            {kw.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {kw.status !== "pending" && (
                              <button
                                onClick={() => kwAction("reset", i)}
                                className="text-xs text-blue-500 hover:text-blue-700"
                              >
                                Reset
                              </button>
                            )}
                            <button
                              onClick={() => kwAction("delete", i)}
                              className="text-xs text-red-400 hover:text-red-600"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {keywords.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-8 text-gray-400">Belum ada keywords</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ARTICLES TAB */}
        {tab === "articles" && (
          <div>
            {artLoading ? (
              <div className="text-center py-10 text-gray-400 text-sm">Loading…</div>
            ) : (
              <>
                <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Artikel</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Kata</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Score</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {articles.map((a) => (
                        <tr key={a.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-800 max-w-xs truncate">{a.title || a.keyword}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{a.category} · {new Date(a.created_at).toLocaleDateString("id-ID")}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{a.word_count?.toLocaleString() || "—"}</td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <div className="flex flex-col gap-0.5">
                              <ScoreBadge label="SEO" value={a.seo_score} />
                              <ScoreBadge label="AEO" value={a.aeo_score} />
                              <ScoreBadge label="AIO" value={a.geo_score} />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] || "bg-gray-100 text-gray-600"}`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => toggleArticle(a.id, a.status)}
                                className="text-xs text-blue-500 hover:text-blue-700 whitespace-nowrap"
                              >
                                {a.status === "published" ? "Unpublish" : "Publish"}
                              </button>
                              {a.slug && (
                                <a
                                  href={`/blog/${a.slug}`}
                                  target="_blank"
                                  className="text-xs text-gray-400 hover:text-gray-600"
                                >
                                  Lihat ↗
                                </a>
                              )}
                              <button
                                onClick={() => deleteArticle(a.id)}
                                className="text-xs text-red-400 hover:text-red-600"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {articles.length === 0 && (
                        <tr><td colSpan={5} className="text-center py-8 text-gray-400">Belum ada artikel</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {artTotal > 20 && (
                  <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                    <span>{artTotal} artikel total</span>
                    <div className="flex gap-2">
                      <button disabled={artPage === 1} onClick={() => loadArticles(artPage - 1)} className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">←</button>
                      <span className="px-3 py-1">Hal {artPage}</span>
                      <button disabled={artPage * 20 >= artTotal} onClick={() => loadArticles(artPage + 1)} className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">→</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* LOGS TAB */}
        {tab === "logs" && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Log Generasi (100 baris terakhir)</h2>
              <button onClick={loadLogs} className="text-xs text-blue-500 hover:text-blue-700">Refresh</button>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 text-xs text-green-400 font-mono overflow-auto max-h-[60vh] whitespace-pre-wrap">
              {logs || "Belum ada log. Jalankan generate terlebih dahulu."}
            </div>
          </div>
        )}
      </div>

      <div className="h-12" />
    </div>
  );
}
