"use client";

import { useState, useEffect, useCallback } from "react";

const CATEGORIES = [
  "Digital Marketing", "SEO", "Google Ads", "Social Media Marketing",
  "Content Marketing", "Email Marketing", "E-commerce",
];

const INTENTS = ["informational", "transactional", "navigational", "commercial"];

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-50 text-amber-700 border border-amber-200",
  done:      "bg-emerald-50 text-emerald-700 border border-emerald-200",
  error:     "bg-red-50 text-red-600 border border-red-200",
  published: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  draft:     "bg-gray-100 text-gray-500 border border-gray-200",
  queued:    "bg-blue-50 text-blue-600 border border-blue-200",
  scheduled: "bg-purple-50 text-purple-600 border border-purple-200",
  rejected:  "bg-red-50 text-red-500 border border-red-200",
};

type SidebarPage =
  | "dashboard"
  | "keywords"
  | "articles"
  | "logs"
  | "knowledge"
  | "settings";

function ScoreBadge({ label, value }: { label: string; value: number | null }) {
  if (value == null) return <span className="text-gray-300 text-xs">—</span>;
  const color =
    value >= 70 ? "text-emerald-600" : value >= 40 ? "text-amber-500" : "text-red-500";
  return (
    <span className={`text-xs font-bold ${color}`}>
      {label}:{value}
    </span>
  );
}

const NAV_ITEMS: { section: string; items: { id: SidebarPage; label: string; icon: string }[] }[] = [
  {
    section: "WORKSPACE",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "▦" },
      { id: "articles",  label: "All Articles", icon: "◧" },
    ],
  },
  {
    section: "MANAGEMENT",
    items: [
      { id: "keywords", label: "Keyword Queue", icon: "⊞" },
      { id: "logs",     label: "Run Logs", icon: "≡" },
    ],
  },
  {
    section: "CONTENT TOOLS",
    items: [
      { id: "knowledge", label: "Knowledge Base", icon: "❓" },
    ],
  },
  {
    section: "SYSTEM",
    items: [
      { id: "settings", label: "Settings", icon: "⚙" },
    ],
  },
];

const KNOWLEDGE_ARTICLES = [
  {
    title: "SEO Scoring Guide",
    icon: "📊",
    content: `## How SEO Score is Calculated

SEO score (0–100) is based on heuristic checks applied to generated articles:

| Check | Points |
|---|---|
| Word count ≥ 1500 | +25 |
| Word count ≥ 800 | +15 |
| Has H1 heading | +10 |
| Has ≥3 H2 headings | +15 |
| Keyword in title | +15 |
| Keyword in first 100 chars | +10 |
| Has numbered/bullet lists | +10 |
| Has external links | +5 |
| Images present | +10 |

**Target: 70+ for strong ranking potential.**

### Tips to Improve SEO Score
- Keep articles ≥ 1500 words (aim for 2000+)
- Always include the target keyword in the H1 title
- Use 3–5 H2 subheadings with related terms
- Add a bullet or numbered list in every article
- Ensure Pexels featured image is fetched correctly`,
  },
  {
    title: "AEO Scoring Guide",
    icon: "🤖",
    content: `## How AEO Score is Calculated

AEO (Answer Engine Optimization) score targets voice search and AI snippets:

| Check | Points |
|---|---|
| Has FAQ section | +30 |
| Has definition paragraph | +20 |
| Has step-by-step list | +20 |
| Answers "what is" / "how to" | +15 |
| Short direct sentences | +15 |

**Target: 60+ for AI assistant citation.**

### Tips to Improve AEO Score
- Always include a **FAQ** section (minimum 5 Q&A pairs)
- Open article with a concise 2-sentence definition
- Use "How to" H2 sections with numbered steps
- Answer questions directly — avoid burying the answer
- The Claude prompt already asks for FAQ, but verify in generated content`,
  },
  {
    title: "AIO Scoring Guide",
    icon: "✨",
    content: `## How AIO Score is Calculated

AIO (AI Overview / GEO) score targets Google's AI Overviews and LLM citations:

| Check | Points |
|---|---|
| Cites statistics/numbers | +25 |
| Mentions authoritative sources | +20 |
| Has comparison/table | +20 |
| Structured data present | +15 |
| Expert perspective mentioned | +20 |

**Target: 60+ for AI Overview inclusion.**

### Tips to Improve AIO Score
- Include at least 3 statistics with source references
- Add comparison tables (e.g., Tool A vs Tool B)
- Mention industry experts or research firms
- Claude prompt asks for stats — verify numbers are realistic
- Consider adding JSON-LD FAQ schema to article pages`,
  },
  {
    title: "Keyword Strategy Guide",
    icon: "🎯",
    content: `## Keyword Selection Strategy

### By Search Intent

| Intent | Goal | Example |
|---|---|---|
| Informational | Education / top of funnel | "apa itu google ads" |
| Transactional | Drive conversions | "jasa google ads terpercaya" |
| Commercial | Research before buy | "google ads vs facebook ads" |
| Navigational | Brand searches | "nuswalab digital marketing" |

### Category Priority
1. **Google Ads** — High commercial intent, direct service match
2. **SEO** — Long-tail, high volume informational
3. **Social Media Marketing** — Broad audience, shareable
4. **Digital Marketing** — Umbrella terms, brand awareness
5. **Content Marketing** — Thought leadership, E-E-A-T signals
6. **Email Marketing** — Niche but high conversion intent

### Volume & Competition
- Target 3–5 word long-tail phrases for new keywords
- Mix 60% informational + 30% commercial + 10% transactional
- Avoid single-word keywords (too competitive)
- Use Bahasa Indonesia variants for local SEO`,
  },
  {
    title: "Article Generation Workflow",
    icon: "🔄",
    content: `## How the Generator Works

\`\`\`
keywords.json (pending)
    ↓
Claude API → 2000+ word article
    ↓
Pexels API → Featured image
    ↓
SEO / AEO / AIO scoring
    ↓
SQLite insert (status = published)
    ↓
Mark keyword as done
    ↓
npm build + pm2 restart
\`\`\`

### Running the Generator
1. Go to **Keyword Queue** and add pending keywords
2. Click **▶ Run Generator** in the header
3. Check **Run Logs** for progress
4. Articles appear in **All Articles** when done

### Cron Schedule
Generator runs automatically at **7 PM (19:00) WIB** daily.

\`\`\`
0 19 * * * cd /home/ubuntu/nuswalab && node scripts/keyword-article-gen.js >> logs/article-gen.log 2>&1
\`\`\`

### Rate Limits
- Max 3 articles per run by default (configurable)
- Anthropic API: up to 5 req/min on standard tier
- Pexels: 200 req/hour, 20,000 req/month`,
  },
  {
    title: "Internal Linking Guide",
    icon: "🔗",
    content: `## Internal Linking Best Practices

Internal links distribute PageRank and improve crawlability.

### Current Setup
Articles are generated independently. To add internal links:

1. **After generation**, edit article HTML to add links to related articles
2. Use keyword-rich anchor text (not "click here")
3. Link from high-traffic pages to newer, lower-traffic pages

### Anchor Text Rules
- ✅ "baca panduan lengkap tentang [keyword]"
- ✅ "strategi [keyword] yang sudah terbukti"
- ❌ "klik di sini" (no keyword value)
- ❌ Same anchor text for different pages (confuses Google)

### Minimum: 2–3 internal links per article`,
  },
];

export default function AdminDashboard() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [page, setPage] = useState<SidebarPage>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [keywords, setKeywords] = useState<any[]>([]);
  const [kwLoading, setKwLoading] = useState(false);
  const [newKw, setNewKw] = useState("");
  const [newCat, setNewCat] = useState("Digital Marketing");
  const [newIntent, setNewIntent] = useState("informational");
  const [activeCatFilter, setActiveCatFilter] = useState("All");

  const [articles, setArticles] = useState<any[]>([]);
  const [artTotal, setArtTotal] = useState(0);
  const [artPage, setArtPage] = useState(1);
  const [artLoading, setArtLoading] = useState(false);

  const [genLoading, setGenLoading] = useState(false);
  const [genMsg, setGenMsg] = useState("");
  const [logs, setLogs] = useState("");
  const [dryRun, setDryRun] = useState(false);
  const [maxGen, setMaxGen] = useState(3);

  const [kbOpen, setKbOpen] = useState<number | null>(0);
  const [settingsMaxGen, setSettingsMaxGen] = useState(3);
  const [settingsDryRun, setSettingsDryRun] = useState(false);

  const headers = { "x-admin-token": token, "Content-Type": "application/json" };

  const loadKeywords = useCallback(async () => {
    setKwLoading(true);
    const res = await fetch("/api/admin/keywords", { headers });
    if (res.ok) setKeywords(await res.json());
    setKwLoading(false);
  }, [token]);

  const loadArticles = useCallback(async (p = 1) => {
    setArtLoading(true);
    const res = await fetch(`/api/admin/articles?page=${p}&limit=20`, { headers });
    if (res.ok) {
      const data = await res.json();
      setArticles(data.articles || []);
      setArtTotal(data.total || 0);
      setArtPage(p);
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
    loadKeywords();
    loadArticles(1);
  }, [authed]);

  useEffect(() => {
    if (!authed) return;
    if (page === "logs") loadLogs();
  }, [page, authed]);

  async function login() {
    const res = await fetch("/api/admin/keywords", { headers: { "x-admin-token": token } });
    if (res.ok) setAuthed(true);
    else alert("Token salah.");
  }

  async function addKeyword() {
    if (!newKw.trim()) return;
    await fetch("/api/admin/keywords", {
      method: "POST", headers,
      body: JSON.stringify({ action: "add", keyword: newKw, category: newCat, search_intent: newIntent }),
    });
    setNewKw("");
    loadKeywords();
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
    setTimeout(() => { loadLogs(); setPage("logs"); }, 3000);
  }

  const kwPending = keywords.filter(k => k.status === "pending").length;
  const kwDone    = keywords.filter(k => k.status === "done").length;
  const kwError   = keywords.filter(k => k.status === "error").length;
  const artPublished = articles.filter(a => a.status === "published").length;
  const artDraft     = articles.filter(a => a.status === "draft").length;

  const catCounts: Record<string, number> = {};
  for (const kw of keywords) catCounts[kw.category] = (catCounts[kw.category] || 0) + 1;

  const filteredKw = activeCatFilter === "All" ? keywords : keywords.filter(k => k.category === activeCatFilter);

  // ── Login ────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">N</div>
            <div>
              <div className="text-gray-900 font-semibold text-sm">Nuswa Lab</div>
              <div className="text-gray-400 text-xs">SEO Article Generator</div>
            </div>
          </div>
          <h1 className="text-gray-900 font-bold text-lg mb-1">Admin Login</h1>
          <p className="text-gray-400 text-xs mb-6">Enter your admin token to continue</p>
          <input
            type="password"
            placeholder="Admin token"
            value={token}
            onChange={e => setToken(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 mb-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
          />
          <button
            onClick={login}
            className="w-full bg-indigo-600 text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-indigo-700 transition"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // ── Main Layout ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-56" : "w-14"} transition-all duration-200 bg-white border-r border-gray-200 flex flex-col shrink-0`}>
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
          <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0">N</div>
          {sidebarOpen && (
            <div className="overflow-hidden flex-1">
              <div className="text-gray-900 text-xs font-bold truncate">Nuswa Lab</div>
              <div className="text-gray-400 text-[10px] truncate">Article Generator</div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(o => !o)} className="text-gray-400 hover:text-gray-600 text-xs shrink-0">
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map(section => (
            <div key={section.section} className="mb-1">
              {sidebarOpen && (
                <div className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 tracking-widest uppercase">
                  {section.section}
                </div>
              )}
              {section.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition ${
                    page === item.id
                      ? "text-indigo-700 bg-indigo-50 border-r-2 border-indigo-600 font-medium"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={triggerGenerate}
            disabled={genLoading || kwPending === 0}
            title="Run Generator"
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              genLoading || kwPending === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            }`}
          >
            <span className="shrink-0">{genLoading ? "⟳" : "▶"}</span>
            {sidebarOpen && <span>{genLoading ? "Running…" : `Run (${kwPending})`}</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-gray-900 text-sm font-semibold">
              {page === "dashboard" ? "Dashboard Overview" :
               page === "keywords" ? "Keyword Queue" :
               page === "articles" ? "All Articles" :
               page === "logs" ? "Run Logs" :
               page === "knowledge" ? "Knowledge Base" : "Settings"}
            </h1>
            {genMsg && <p className="text-indigo-600 text-xs mt-0.5">{genMsg}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              {kwPending} pending · {artTotal} articles
            </div>
            <button onClick={() => { setAuthed(false); setToken(""); }} className="text-xs text-gray-400 hover:text-gray-600">
              Sign out
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* ── DASHBOARD ─────────────────────────────────────── */}
          {page === "dashboard" && (
            <div className="space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "TOTAL ARTICLES", value: artTotal, bg: "bg-white", val: "text-gray-900" },
                  { label: "KW QUEUE",       value: kwPending, bg: "bg-amber-50",   val: "text-amber-600" },
                  { label: "DRAFT",          value: artDraft,  bg: "bg-gray-50",    val: "text-gray-600" },
                  { label: "PUBLISHED",      value: artPublished, bg: "bg-emerald-50", val: "text-emerald-600" },
                  { label: "KW DONE",        value: kwDone,    bg: "bg-emerald-50", val: "text-emerald-600" },
                  { label: "KW ERROR",       value: kwError,   bg: "bg-red-50",     val: "text-red-500" },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} border border-gray-200 rounded-xl p-4`}>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">{s.label}</div>
                    <div className={`text-3xl font-bold ${s.val}`}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Pipeline + Quick actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Pipeline Status</div>
                  <div className="space-y-3">
                    {[
                      { label: "Keywords Pending", value: kwPending, color: "bg-amber-400", max: Math.max(kwPending + kwDone, 1) },
                      { label: "Keywords Done",    value: kwDone,    color: "bg-emerald-500", max: Math.max(kwPending + kwDone, 1) },
                      { label: "Published",        value: artPublished, color: "bg-indigo-500", max: Math.max(artTotal, 1) },
                      { label: "Draft",            value: artDraft,  color: "bg-gray-300", max: Math.max(artTotal, 1) },
                    ].map(item => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{item.label}</span>
                          <span className="text-gray-700 font-medium">{item.value}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${Math.round((item.value / item.max) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={triggerGenerate}
                    disabled={genLoading || kwPending === 0}
                    className="mt-5 w-full bg-indigo-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                  >
                    {genLoading ? "⟳ Running…" : `▶ Run All Queued (${kwPending})`}
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Quick Actions</div>
                  <div className="space-y-2">
                    {[
                      { label: "Keyword Queue",  desc: "Add & manage keywords",     id: "keywords" as SidebarPage, bg: "bg-amber-50 border-amber-200 hover:bg-amber-100", text: "text-amber-700" },
                      { label: "All Articles",   desc: "Review & publish articles", id: "articles" as SidebarPage, bg: "bg-indigo-50 border-indigo-200 hover:bg-indigo-100", text: "text-indigo-700" },
                      { label: "Run Logs",       desc: "View generation logs",      id: "logs" as SidebarPage, bg: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100", text: "text-emerald-700" },
                      { label: "Knowledge Base", desc: "SEO / AEO / AIO guides",   id: "knowledge" as SidebarPage, bg: "bg-purple-50 border-purple-200 hover:bg-purple-100", text: "text-purple-700" },
                    ].map(a => (
                      <button
                        key={a.id}
                        onClick={() => setPage(a.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-xs font-medium transition ${a.bg} ${a.text}`}
                      >
                        <div className="text-left">
                          <div className="font-semibold">{a.label}</div>
                          <div className="text-[10px] opacity-70 mt-0.5">{a.desc}</div>
                        </div>
                        <span className="opacity-40">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category breakdown */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Keywords by Category</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {CATEGORIES.map(cat => {
                    const count = catCounts[cat] || 0;
                    const pendCount = keywords.filter(k => k.category === cat && k.status === "pending").length;
                    return (
                      <button
                        key={cat}
                        onClick={() => { setPage("keywords"); setActiveCatFilter(cat); }}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-left hover:border-indigo-300 hover:bg-indigo-50 transition"
                      >
                        <div className="text-gray-900 text-sm font-bold">{count}</div>
                        <div className="text-gray-500 text-[10px] mt-0.5 leading-snug">{cat}</div>
                        {pendCount > 0 && (
                          <div className="mt-1 text-[10px] text-amber-600 font-medium">{pendCount} pending</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── KEYWORDS ──────────────────────────────────────── */}
          {page === "keywords" && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Add New Keyword</div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="e.g. google ads untuk bisnis makanan di malaysia"
                    value={newKw}
                    onChange={e => setNewKw(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addKeyword()}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition"
                  />
                  <select value={newCat} onChange={e => setNewCat(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-indigo-400">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <select value={newIntent} onChange={e => setNewIntent(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-indigo-400">
                    {INTENTS.map(i => <option key={i}>{i}</option>)}
                  </select>
                  <button onClick={addKeyword} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition whitespace-nowrap shadow-sm">
                    + Add
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-5">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} className="accent-indigo-600" />
                  Dry Run (no save)
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  Max per run:
                  <input type="number" min={1} max={10} value={maxGen} onChange={e => setMaxGen(Number(e.target.value))} className="w-14 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm text-gray-900 focus:outline-none focus:border-indigo-400" />
                </label>
                <button onClick={() => kwAction("reset_all", 0)} className="text-xs text-gray-400 hover:text-gray-600 underline">
                  Reset all to pending
                </button>
              </div>

              {/* Category tabs */}
              <div className="flex gap-2 flex-wrap">
                {["All", ...CATEGORIES].map(cat => {
                  const cnt = cat === "All" ? keywords.length : (catCounts[cat] || 0);
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCatFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                        activeCatFilter === cat
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white text-gray-500 border-gray-200 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {cat} <span className="opacity-60">({cnt})</span>
                    </button>
                  );
                })}
              </div>

              {kwLoading ? (
                <div className="text-center py-10 text-gray-400 text-sm">Loading…</div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">#</th>
                        <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Keyword</th>
                        <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest hidden sm:table-cell">Category</th>
                        <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest hidden sm:table-cell">Intent</th>
                        <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Status</th>
                        <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredKw.map((kw, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-3 text-gray-800 font-medium max-w-xs">{kw.keyword}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{kw.category}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{kw.search_intent}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[kw.status] || "bg-gray-100 text-gray-500"}`}>
                              {kw.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-3">
                              {kw.status !== "pending" && (
                                <button onClick={() => kwAction("reset", keywords.indexOf(kw))} className="text-xs text-indigo-500 hover:text-indigo-700">Reset</button>
                              )}
                              <button onClick={() => kwAction("delete", keywords.indexOf(kw))} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredKw.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">No keywords found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── ARTICLES ──────────────────────────────────────── */}
          {page === "articles" && (
            <div className="space-y-4">
              {artLoading ? (
                <div className="text-center py-10 text-gray-400 text-sm">Loading…</div>
              ) : (
                <>
                  <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Article</th>
                          <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest hidden md:table-cell">Words</th>
                          <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest hidden lg:table-cell">Scores</th>
                          <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Status</th>
                          <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {articles.map(a => (
                          <tr key={a.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-800 max-w-xs truncate">{a.title || a.keyword}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">{a.category} · {new Date(a.created_at).toLocaleDateString("id-ID")}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{a.word_count?.toLocaleString() || "—"}</td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <div className="flex gap-2">
                                <ScoreBadge label="SEO" value={a.seo_score} />
                                <ScoreBadge label="AEO" value={a.aeo_score} />
                                <ScoreBadge label="AIO" value={a.geo_score} />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[a.status] || "bg-gray-100 text-gray-500"}`}>
                                {a.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-3 flex-wrap">
                                <button onClick={() => toggleArticle(a.id, a.status)} className="text-xs text-indigo-500 hover:text-indigo-700 whitespace-nowrap">
                                  {a.status === "published" ? "Unpublish" : "Publish"}
                                </button>
                                {a.slug && (
                                  <a href={`/blog/${a.slug}`} target="_blank" className="text-xs text-gray-400 hover:text-gray-600">View ↗</a>
                                )}
                                <button onClick={() => deleteArticle(a.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {articles.length === 0 && (
                          <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">No articles found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {artTotal > 20 && (
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>{artTotal} articles total</span>
                      <div className="flex gap-2">
                        <button disabled={artPage === 1} onClick={() => loadArticles(artPage - 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs disabled:opacity-30 hover:bg-gray-50">←</button>
                        <span className="px-3 py-1.5 text-xs text-gray-400">Page {artPage}</span>
                        <button disabled={artPage * 20 >= artTotal} onClick={() => loadArticles(artPage + 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs disabled:opacity-30 hover:bg-gray-50">→</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── LOGS ──────────────────────────────────────────── */}
          {page === "logs" && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">Last 100 lines of generation log</div>
                <button onClick={loadLogs} className="text-xs text-indigo-500 hover:text-indigo-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 bg-white">
                  ↻ Refresh
                </button>
              </div>
              <div className="bg-gray-900 border border-gray-200 rounded-xl p-5 text-xs text-emerald-400 font-mono overflow-auto max-h-[70vh] whitespace-pre-wrap leading-relaxed shadow-inner">
                {logs || "No logs yet. Run the generator first."}
              </div>
            </div>
          )}

          {/* ── KNOWLEDGE BASE ────────────────────────────────── */}
          {page === "knowledge" && (
            <div className="space-y-3">
              <p className="text-gray-500 text-sm">Reference guides for article generation, SEO scoring, and content strategy.</p>
              {KNOWLEDGE_ARTICLES.map((art, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setKbOpen(kbOpen === i ? null : i)}
                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition text-left"
                  >
                    <span className="text-xl shrink-0">{art.icon}</span>
                    <span className="text-gray-900 font-semibold text-sm flex-1">{art.title}</span>
                    <span className="text-gray-400 text-xs">{kbOpen === i ? "▲" : "▼"}</span>
                  </button>
                  {kbOpen === i && (
                    <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                      <MarkdownContent content={art.content} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── SETTINGS ──────────────────────────────────────── */}
          {page === "settings" && (
            <div className="space-y-4 max-w-lg">
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Generation Settings</div>
                <label className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-800">Max Articles per Run</div>
                    <div className="text-xs text-gray-400 mt-0.5">How many keywords to process in one run</div>
                  </div>
                  <input
                    type="number" min={1} max={20} value={settingsMaxGen}
                    onChange={e => { setSettingsMaxGen(Number(e.target.value)); setMaxGen(Number(e.target.value)); }}
                    className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 text-center focus:outline-none focus:border-indigo-400"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-sm text-gray-800">Dry Run Mode</div>
                    <div className="text-xs text-gray-400 mt-0.5">Generate article but don't save to DB</div>
                  </div>
                  <div
                    onClick={() => { setSettingsDryRun(d => !d); setDryRun(d => !d); }}
                    className={`w-10 h-6 rounded-full transition-colors cursor-pointer flex items-center px-1 ${settingsDryRun ? "bg-indigo-600" : "bg-gray-200"}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${settingsDryRun ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                </label>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">System Info</div>
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex justify-between"><span>Cron Schedule</span><span className="text-gray-700 font-medium">Daily 19:00 WIB</span></div>
                  <div className="flex justify-between"><span>Generator Script</span><span className="text-gray-700 font-mono">scripts/keyword-article-gen.js</span></div>
                  <div className="flex justify-between"><span>Database</span><span className="text-gray-700 font-mono">data.db (SQLite)</span></div>
                  <div className="flex justify-between"><span>Image Provider</span><span className="text-gray-700">Pexels API</span></div>
                  <div className="flex justify-between"><span>AI Model</span><span className="text-gray-700">claude-opus-4-5</span></div>
                  <div className="flex justify-between"><span>Admin URL</span><span className="text-gray-700">seo.nuswalab.com</span></div>
                </div>
              </div>

              <div className="bg-white border border-red-100 rounded-xl p-5">
                <div className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-4">Danger Zone</div>
                <button
                  onClick={() => kwAction("reset_all", 0)}
                  className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-4 py-2 hover:bg-red-50 transition"
                >
                  Reset All Keywords to Pending
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// Simple inline markdown renderer
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-gray-900 font-semibold text-sm mt-4 mb-2">{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-gray-700 font-semibold text-xs mt-3 mb-1.5">{line.slice(4)}</h3>);
    } else if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { codeLines.push(lines[i]); i++; }
      elements.push(
        <pre key={i} className="bg-gray-900 text-emerald-400 border border-gray-200 rounded-lg p-3 text-xs font-mono overflow-x-auto my-2 whitespace-pre">
          {codeLines.join("\n")}
        </pre>
      );
    } else if (line.startsWith("| ")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        if (!lines[i].match(/^\|[-| ]+\|$/)) rows.push(lines[i].split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(s => s.trim()));
        i++;
      }
      elements.push(
        <div key={i} className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                {rows[0]?.map((cell, ci) => <th key={ci} className="text-left py-2 pr-4 text-gray-600 font-semibold whitespace-nowrap">{cell}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, ri) => (
                <tr key={ri} className="border-b border-gray-100">
                  {row.map((cell, ci) => <td key={ci} className="py-2 pr-4 text-gray-600 whitespace-nowrap">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    } else if (line.startsWith("- ") || line.startsWith("✅ ") || line.startsWith("❌ ")) {
      elements.push(
        <div key={i} className="flex gap-2 text-xs text-gray-600 my-0.5">
          <span className="shrink-0 mt-0.5 text-gray-400">•</span>
          <span dangerouslySetInnerHTML={{ __html: line.replace(/^[-✅❌] /, "").replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-800">$1</strong>').replace(/`(.*?)`/g, '<code class="bg-gray-100 text-indigo-700 px-1 rounded text-[10px]">$1</code>') }} />
        </div>
      );
    } else if (line.match(/^\d+\. /)) {
      elements.push(
        <div key={i} className="flex gap-2 text-xs text-gray-600 my-0.5">
          <span className="shrink-0 text-gray-400">{line.match(/^\d+/)![0]}.</span>
          <span dangerouslySetInnerHTML={{ __html: line.replace(/^\d+\. /, "").replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-800">$1</strong>').replace(/`(.*?)`/g, '<code class="bg-gray-100 text-indigo-700 px-1 rounded text-[10px]">$1</code>') }} />
        </div>
      );
    } else if (line.trim() !== "") {
      elements.push(
        <p key={i} className="text-xs text-gray-600 my-1.5 leading-relaxed"
           dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-800">$1</strong>').replace(/`(.*?)`/g, '<code class="bg-gray-100 text-indigo-700 px-1 rounded text-[10px]">$1</code>') }} />
      );
    }
    i++;
  }
  return <div>{elements}</div>;
}
