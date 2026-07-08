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
  | "settings"
  | "health"
  | "research"
  | "calendar";

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
      { id: "articles",  label: "All Articles", icon: "▧" },
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
      { id: "research", label: "Keyword Research", icon: "🔍" },
      { id: "health",   label: "Health Check",     icon: "❤️" },
      { id: "calendar", label: "Content Calendar", icon: "📅" },
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
    title: "SEO Strategy & Scoring",
    icon: "📊",
    content: `## SEO Score Calculation

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

---

## Modern SEO Strategy 2024–2025

### 1. E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
Google's quality rater guidelines heavily weight E-E-A-T — especially for YMYL (Your Money Your Life) topics like finance, health, and marketing.

- **Experience**: Add first-person case studies, real data ("our agency tested X and saw Y% improvement")
- **Expertise**: Include author credentials, cite research papers or industry studies (HubSpot, Semrush, Google)
- **Authoritativeness**: Earn backlinks from .edu, .gov, or high-DA industry sites
- **Trustworthiness**: Include accurate statistics with source dates (avoid outdated stats)

### 2. Semantic SEO & Topical Authority
Google understands topics, not just keywords. Build topic clusters:
- **Pillar page**: Comprehensive guide on a broad topic (e.g., "Panduan Google Ads Lengkap")
- **Cluster pages**: Deep-dives on subtopics linked back to pillar (e.g., "Cara Setting Google Ads untuk UMKM")
- **Entity coverage**: Mention related entities (brands, tools, concepts) naturally in content

### 3. Search Intent Alignment
Mismatching intent is the #1 reason content doesn't rank:

| Intent | Content Format | Example |
|---|---|---|
| Informational | Long-form guide, how-to, definitions | "apa itu google ads" |
| Commercial | Comparison, review, pros/cons | "google ads vs facebook ads" |
| Transactional | Landing page, CTA-focused | "jasa google ads jakarta" |
| Navigational | Brand page, service page | "nuswalab digital marketing" |

### 4. Content Structure for Ranking
- **Title tag**: Include keyword + power word (e.g., "Panduan Lengkap", "Terbaru 2025", "Terbukti")
- **Meta description**: 150–160 chars, keyword + clear benefit + CTA
- **H1**: Exact-match or close variant of target keyword
- **H2s**: Use question format (Who, What, Why, How, When) — matches "People Also Ask"
- **First 100 words**: State the keyword and promise what the article delivers
- **Conclusion**: Summarize key points + CTA (internal link to service page)

### 5. Core Web Vitals (Technical SEO)
Google's ranking signals since 2021:
- **LCP (Largest Contentful Paint)**: < 2.5s — optimize images (WebP, lazy load)
- **FID/INP (Interaction to Next Paint)**: < 200ms — minimize JS blocking
- **CLS (Cumulative Layout Shift)**: < 0.1 — set width/height on images, avoid ads shifting layout

### 6. Indonesian Local SEO Tips
- Use Bahasa Indonesia keyword variants: "cara", "panduan", "tips", "terbaik", "murah"
- Target "[service] + [kota]" for local intent (e.g., "jasa SEO Surabaya")
- Register Google Business Profile for local pack ranking
- Get citations from Indonesian directories (Tokopedia seller page, Yellow Pages ID)

### Quick Wins for Article Generator
- ✅ Aim for 2000–2500 words per article
- ✅ Include keyword in H1, first paragraph, at least 2 H2s
- ✅ Add 1 external link to authoritative source (Google, HubSpot, Semrush blog)
- ✅ Include 1 data table or comparison
- ✅ End with FAQ section (helps with "People Also Ask" boxes)`,
  },
  {
    title: "AEO Strategy & Scoring",
    icon: "🤖",
    content: `## AEO Score Calculation

AEO (Answer Engine Optimization) score targets voice search, featured snippets, and AI assistant citations:

| Check | Points |
|---|---|
| Has FAQ section | +30 |
| Has definition paragraph | +20 |
| Has step-by-step list | +20 |
| Answers "what is" / "how to" | +15 |
| Short direct sentences | +15 |

**Target: 60+ for AI assistant citation and featured snippet inclusion.**

---

## Modern AEO Strategy 2024–2025

### What is AEO?
Answer Engine Optimization is the practice of structuring content so that AI assistants (Siri, Alexa, Google Assistant), voice search, and Google's featured snippet boxes can extract and present your answer directly — without the user clicking through.

### 1. Featured Snippet Optimization
Google's featured snippets (position zero) are the primary AEO target:

**Paragraph snippets** (most common):
- Answer the question in the **first 40–60 words** of a section
- Start with "X adalah..." or "X merupakan..." for definition queries
- Follow immediately with 2–3 supporting sentences

**List snippets**:
- Use \`<ol>\` or \`<ul>\` for "cara", "langkah", "tips" queries
- Keep each item under 10 words
- 5–8 items is the sweet spot

**Table snippets**:
- Use for comparison queries ("X vs Y", "perbedaan A dan B")
- Keep tables simple: 2–4 columns, clear headers

### 2. FAQ Schema Markup
FAQ schema is critical for AEO — it gets your Q&A directly into Google SERPs:

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Apa itu Google Ads?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Google Ads adalah platform periklanan berbayar dari Google..."
    }
  }]
}
\`\`\`

- Minimum **5 Q&A pairs** per article
- Questions should match actual search queries (check "People Also Ask" boxes)
- Answers: 40–300 words, direct and factual

### 3. Voice Search Optimization
Voice search queries are **conversational** and **longer** than typed queries:
- Target natural language: "bagaimana cara setting Google Ads untuk pemula"
- Use question-format H2 headings: "Berapa Biaya Google Ads per Bulan?"
- Answer immediately after the question heading (no preamble)
- Local queries: optimize for "dekat saya" and "[layanan] di [kota]"

### 4. "People Also Ask" (PAA) Optimization
PAA boxes appear in 40%+ of Google searches and drive significant AEO visibility:
- Research PAA boxes for your target keyword
- Create a dedicated H2 section answering each PAA question
- Format: question as H3, concise 2–3 sentence answer immediately after

### 5. Conversational Content Structure
AI assistants prefer content that sounds like it's answering a person directly:

**DO:**
- "Google Ads bekerja dengan cara..."
- "Untuk memulai, Anda perlu..."
- "Langkah pertama adalah..."

**DON'T:**
- Long introductory paragraphs before the answer
- Passive voice constructions
- Vague language ("mungkin", "bisa jadi")

### Quick Wins for Article Generator
- ✅ Always include a ## FAQ section with 5+ Q&As
- ✅ Open with a crisp 2-sentence definition of the topic
- ✅ Use numbered lists for any "how to" content
- ✅ Add FAQ JSON-LD schema in article \`<head>\`
- ✅ Match H2 headings to question-format PAA queries`,
  },
  {
    title: "AIO / GEO Strategy & Scoring",
    icon: "✨",
    content: `## AIO Score Calculation

AIO (AI Overview / GEO — Generative Engine Optimization) score targets Google's AI Overviews and LLM citation:

| Check | Points |
|---|---|
| Cites statistics/numbers | +25 |
| Mentions authoritative sources | +20 |
| Has comparison/table | +20 |
| Structured data present | +15 |
| Expert perspective mentioned | +20 |

**Target: 60+ for AI Overview inclusion and LLM citation.**

---

## Modern GEO / AIO Strategy 2024–2025

### What Changed: Google AI Overviews
Google AI Overviews (formerly Search Generative Experience / SGE) launched globally in 2024. Instead of showing 10 blue links, Google now synthesizes an answer from multiple web sources at the top of the SERP. Being cited = massive exposure without requiring a click.

### 1. The GEO Content Framework
Research from Princeton/Georgia Tech (2024) identified what content AI systems prefer to cite:

| Signal | Impact | How to Implement |
|---|---|---|
| Statistics with sources | Very High | "Menurut laporan HubSpot 2024, 72% marketer..." |
| Quotations from experts | High | Include named expert quotes |
| Research citations | High | Reference Google, Semrush, McKinsey reports |
| Fluency & clarity | Medium | Short paragraphs, active voice |
| Unique insights | High | First-person data, original analysis |

### 2. Cite-worthy Content Patterns
LLMs (GPT, Claude, Gemini) and Google AI Overviews prefer to cite content that:

**Has verifiable claims:**
- ✅ "CTR iklan display rata-rata 0.1% (Google, 2024)"
- ❌ "CTR iklan display sangat rendah"

**Presents structured comparisons:**
| Tool | Kelebihan | Kekurangan | Harga |
|---|---|---|---|
| Google Ads | Reach terluas, intent tinggi | Mahal, kurva belajar curam | Rp 5.000/klik |
| Meta Ads | Visual, targeting demografi | Intent lebih rendah | Rp 2.000/klik |

**Contains expert perspectives:**
- "Neil Patel merekomendasikan..."
- "Menurut Rand Fishkin dari SparkToro..."
- "Pakar SEO setuju bahwa..."

### 3. Structured Data Beyond FAQ
Structured data helps AI understand your content's entities:

**Article schema**: Author, datePublished, organization
**HowTo schema**: For step-by-step guides
**BreadcrumbList**: For hierarchy signal
**Organization schema**: For brand E-E-A-T

### 4. Content Depth & Comprehensiveness
AI systems prefer content that covers a topic completely:
- **Primary topic**: 60% of content
- **Subtopics**: Cover all related angles (why, how, when, who, cost, examples)
- **Counter-arguments**: Acknowledge limitations ("Google Ads tidak cocok untuk bisnis X karena...")
- **Next steps**: Always recommend actionable follow-up

### 5. Freshness Signals
AI Overviews strongly prefer fresh content:
- Include the current year in the title: "Panduan Google Ads 2025"
- Mention recent updates: "Setelah pembaruan Google Helpful Content 2024..."
- Update existing articles with new stats (re-publish date matters)
- Add "Terakhir diperbarui: [bulan tahun]" near the top

### 6. Multi-Modal Signals
- **Images with descriptive alt text**: "infografis cara kerja google ads bidding"
- **Video embeds**: Articles with embedded video get 3x more AI Overview citations
- **Data visualizations**: Charts and graphs described in text

### Quick Wins for Article Generator
- ✅ Include 3+ statistics with source and year in parentheses
- ✅ Add at least 1 comparison table per article
- ✅ Mention 1–2 industry experts or research firms by name
- ✅ Add Article + FAQ JSON-LD schema
- ✅ Include "updated [year]" in title or meta
- ✅ Cover topic comprehensively — avoid thin content`,
  },
  {
    title: "Keyword Strategy Guide",
    icon: "🎯",
    content: `## Keyword Selection Strategy

### By Search Intent

| Intent | Goal | Content Type | Example |
|---|---|---|---|
| Informational | Education / top of funnel | Long-form guide, how-to | "apa itu google ads" |
| Commercial | Research before buy | Comparison, review | "google ads vs facebook ads" |
| Transactional | Drive conversions | Landing page, CTA | "jasa google ads terpercaya" |
| Navigational | Brand searches | Service/brand page | "nuswalab digital marketing" |

### Keyword Difficulty vs. Opportunity Matrix

| Zone | KD | Volume | Strategy |
|---|---|---|---|
| Quick Wins | Low (0–30) | Medium | Publish fast, rank in 1–3 months |
| Long-term | High (60+) | High | Build authority slowly |
| Niche Gold | Low (0–30) | Low | Low effort, high conversion |
| Avoid | High (60+) | Low | Not worth the effort |

### Category Priority for Nuswalab
1. **Google Ads** — High commercial intent, direct service match
2. **SEO** — Long-tail, high volume informational
3. **Social Media Marketing** — Broad audience, shareable
4. **Digital Marketing** — Umbrella terms, brand awareness
5. **Content Marketing** — Thought leadership, E-E-A-T signals
6. **Email Marketing** — Niche but high conversion intent

### Long-tail Keyword Formula
Long-tail keywords (3–5 words) account for 70% of all searches:

\`\`\`
[modifier] + [main keyword] + [qualifier]

"cara" + "setting google ads" + "untuk pemula"
"tips" + "seo" + "terbaru 2025"
"strategi" + "email marketing" + "meningkatkan konversi"
\`\`\`

### Keyword Mix Strategy
- **60% Informational** — "apa itu", "cara", "panduan", "tips" → drives organic traffic
- **30% Commercial** — "terbaik", "rekomendasi", "vs", "perbandingan" → drives leads
- **10% Transactional** — "jasa", "harga", "biaya", "hire" → drives conversions

### Indonesian Language Variants
Always generate Bahasa Indonesia variants:
- Formal: "strategi pemasaran digital"
- Informal: "cara belajar digital marketing"
- Slang/colloquial: "tips iklan fb biar laris"
- Local: "[keyword] + [kota]" for local intent

### Keyword Research Process
1. Seed keyword → expand with "apa itu", "cara", "tips", "terbaik", "2025"
2. Check Google autocomplete + PAA boxes for related questions
3. Validate with free tools: Ubersuggest, Google Keyword Planner, Ahrefs free
4. Group by intent before adding to queue`,
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

### Optimal Prompt Structure for Claude
For best SEO/AEO/AIO scores, prompts should request:
1. **Definition paragraph** in first 100 words (AEO)
2. **Word count ≥ 2000** (SEO)
3. **Numbered steps** for "how to" content (AEO)
4. **3+ statistics** with source in parentheses (AIO)
5. **1 comparison table** (AIO)
6. **5+ FAQ pairs** at the end (AEO + AIO)
7. **Keyword** in H1 and first 2 H2 headings (SEO)

### Rate Limits
- Max 3 articles per run by default (configurable)
- Anthropic API: up to 5 req/min on standard tier
- Pexels: 200 req/hour, 20,000 req/month

### Quality Checklist (Post-Generation)
- [ ] SEO score ≥ 70?
- [ ] AEO score ≥ 60?
- [ ] AIO score ≥ 60?
- [ ] Featured image loaded?
- [ ] No hallucinated statistics?
- [ ] FAQ section present with ≥5 Q&As?`,
  },
  {
    title: "E-E-A-T & Content Quality",
    icon: "⭐",
    content: `## E-E-A-T: Google's Quality Framework

E-E-A-T stands for **Experience, Expertise, Authoritativeness, Trustworthiness** — Google's framework for evaluating content quality, especially important since the Helpful Content Updates (2022–2024).

### Why E-E-A-T Matters
Google's Search Quality Rater Guidelines use E-E-A-T to train ranking algorithms. Low E-E-A-T content gets demoted; high E-E-A-T content ranks even with fewer backlinks.

---

### 1. Experience (Pengalaman)
**What it means**: Content written by someone with first-hand experience with the topic.

**How to signal it in articles:**
- Include real examples: "Ketika kami mengelola kampanye Google Ads untuk klien e-commerce..."
- Add specific data from real projects: "Dengan budget Rp 5 juta/bulan, kami berhasil mencapai ROAS 4x"
- Use "kami", "tim kami", "berdasarkan pengalaman kami" naturally
- Show before/after: "Sebelum optimasi CTR 1.2%, setelah optimasi 3.8%"

### 2. Expertise (Keahlian)
**What it means**: Content demonstrates deep knowledge of the subject.

**How to signal it:**
- Use correct industry terminology (CPC, ROAS, CTR, Quality Score, Ad Rank)
- Explain nuances: "Google Ads menggunakan second-price auction, artinya..."
- Reference official Google documentation or Google's own guidelines
- Avoid oversimplification — acknowledge edge cases and exceptions

### 3. Authoritativeness (Otoritas)
**What it means**: Your site/brand is recognized as a go-to source in your niche.

**How to build it:**
- **Backlink strategy**: Guest post on Glints, IDN Times, Detik Finance, Kompas Tekno
- **Citation**: Get mentioned in Indonesian marketing forums (Kaskus bisnis, Facebook groups)
- **Social proof**: Mention client count, years in business, awards
- **Content depth**: Publish the most comprehensive guide on each topic

### 4. Trustworthiness (Kepercayaan)
**What it means**: Users and Google can trust your content is accurate and honest.

**How to signal it:**
- Cite sources: "Menurut laporan Think with Google 2024..."
- Acknowledge limitations: "Google Ads tidak selalu cocok untuk semua bisnis"
- Update content: Add "Terakhir diperbarui: [bulan tahun]"
- Include accurate contact info and about page

---

### Helpful Content Signals (2024)
Since the Helpful Content Update, Google penalizes "content for search engines":

**Content Google REWARDS:**
- Written for actual humans with real questions
- Provides insight or analysis beyond what's obvious
- Satisfies the user's query without making them search again
- Has a clear purpose and audience

**Content Google PENALIZES:**
- Thin content that rephrases other articles
- Keyword stuffing or forced keyword insertion
- Content that doesn't add new value
- Clickbait titles that don't match content

### E-E-A-T Checklist for Generated Articles
- [ ] Has at least 1 first-person experience statement
- [ ] Uses correct technical terminology
- [ ] Cites at least 1 authoritative source
- [ ] Acknowledges limitations or exceptions
- [ ] Statistics have source and year
- [ ] Content fully satisfies the search query`,
  },
  {
    title: "Internal Linking & Site Architecture",
    icon: "🔗",
    content: `## Internal Linking Strategy

Internal links distribute PageRank (link equity), improve crawlability, and keep users on-site longer — all positive ranking signals.

### Site Architecture Principle: Flat vs. Deep

**Flat architecture (recommended for SEO):**
\`\`\`
Homepage
├── /blog/panduan-google-ads (Pillar)
│   └── /blog/cara-setting-google-ads (Cluster)
│   └── /blog/google-ads-untuk-umkm (Cluster)
└── /blog/panduan-seo (Pillar)
    └── /blog/teknik-seo-onpage (Cluster)
\`\`\`
- No article should be more than **3 clicks from homepage**
- Pillar pages link to all cluster pages
- Cluster pages link back to pillar + to related clusters

### Internal Link Placement
**High-value placements (pass most PageRank):**
1. First 200 words of the article (editorial context = high value)
2. Within the body text using descriptive anchor text
3. "Related Articles" section at the end

**Avoid:**
- Footer or sidebar "related posts" widgets (low value)
- Too many links in a single paragraph (dilutes value)
- Navigation menus only (technical crawl links, less editorial value)

### Anchor Text Best Practices

| Type | Example | Usage |
|---|---|---|
| Exact match | "panduan google ads" | Use sparingly (1–2x per site) |
| Partial match | "strategi google ads terbaik" | Most common, natural |
| Branded | "layanan Nuswalab" | For service pages |
| Generic | "klik di sini" | AVOID — no keyword signal |
| Naked URL | "nuswalab.com/blog/..." | Occasionally OK |

### Minimum Internal Link Requirements
- **Every article**: 2–3 internal links to related articles
- **Pillar articles**: 5–8 links to cluster articles
- **Category pages**: Link to all articles in that category
- **Homepage**: Link to top 5 pillar articles

### PageRank Flow Strategy
1. Identify your **top-traffic articles** (check Google Search Console)
2. Add internal links FROM high-traffic articles TO newer/lower-traffic articles
3. This "passes" authority to help new content rank faster

### Crawl Efficiency
- Submit updated sitemap to Google Search Console after each batch publish
- Ensure all articles appear in \`/sitemap.xml\`
- Fix broken internal links monthly (crawl with Screaming Frog free tier)

### Implementation in Article Generator
Add to Claude prompt: "End the article with a 'Artikel Terkait' section suggesting 2-3 related topics from this list: [inject category keywords]"`,
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

  // Bulk import
  const [bulkKwText, setBulkKwText] = useState("");
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkMsg, setBulkMsg] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  // Research
  const [researchSeed, setResearchSeed] = useState("");
  const [researchCat, setResearchCat] = useState("Digital Marketing");
  const [researchType, setResearchType] = useState<"expand" | "competitor">("expand");
  const [researchResults, setResearchResults] = useState<any[]>([]);
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchMsg, setResearchMsg] = useState("");
  const [addedKws, setAddedKws] = useState<Set<string>>(new Set());

  // All articles (health check + calendar)
  const [allArticles, setAllArticles] = useState<any[]>([]);
  const [allArtLoading, setAllArtLoading] = useState(false);
  const [healthFilter, setHealthFilter] = useState<"all" | "low_seo" | "low_aeo" | "low_aio" | "no_image">("all");

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

  useEffect(() => {
    if (!authed) return;
    if ((page === "health" || page === "calendar") && allArticles.length === 0) loadAllArticles();
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

  async function bulkImport() {
    const lines = bulkKwText.split("\n").map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setBulkImporting(true);
    setBulkMsg("");
    for (const kw of lines) {
      await fetch("/api/admin/keywords", {
        method: "POST", headers,
        body: JSON.stringify({ action: "add", keyword: kw, category: newCat, search_intent: newIntent }),
      });
    }
    setBulkMsg(`✓ ${lines.length} keywords imported`);
    setBulkKwText("");
    loadKeywords();
    setBulkImporting(false);
  }

  async function loadAllArticles() {
    setAllArtLoading(true);
    let all: any[] = [];
    for (let p = 1; p <= 4; p++) {
      const res = await fetch(`/api/admin/articles?page=${p}&limit=50`, { headers });
      if (!res.ok) break;
      const data = await res.json();
      all = [...all, ...(data.articles || [])];
      if (all.length >= (data.total || 0)) break;
    }
    setAllArticles(all);
    setAllArtLoading(false);
  }

  async function triggerResearch() {
    if (!researchSeed.trim()) return;
    setResearchLoading(true);
    setResearchMsg("");
    setResearchResults([]);
    const res = await fetch("/api/admin/research", {
      method: "POST", headers,
      body: JSON.stringify({ seed: researchSeed, category: researchCat, type: researchType }),
    });
    const data = await res.json();
    if (data.keywords) setResearchResults(data.keywords);
    else setResearchMsg(data.error || "Failed to generate suggestions");
    setResearchLoading(false);
  }

  async function addResearchKw(kw: any) {
    await fetch("/api/admin/keywords", {
      method: "POST", headers,
      body: JSON.stringify({ action: "add", keyword: kw.keyword, category: kw.category || researchCat, search_intent: kw.search_intent }),
    });
    setAddedKws(prev => new Set([...prev, kw.keyword]));
    loadKeywords();
  }

  function exportCSV() {
    const rows = allArticles.length ? allArticles : articles;
    if (!rows.length) { alert("No articles to export"); return; }
    const cols = ["id","title","keyword","category","status","word_count","seo_score","aeo_score","geo_score","created_at","published_date"];
    const csv = [
      cols.join(","),
      ...rows.map(a => cols.map(c => `"${String(a[c] ?? "").replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `articles-${new Date().toISOString().slice(0,10)}.csv`; link.click();
    URL.revokeObjectURL(url);
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

  const avgSeo = articles.length ? Math.round(articles.reduce((s, a) => s + (a.seo_score || 0), 0) / articles.length) : 0;
  const avgAeo = articles.length ? Math.round(articles.reduce((s, a) => s + (a.aeo_score || 0), 0) / articles.length) : 0;
  const avgAio = articles.length ? Math.round(articles.reduce((s, a) => s + (a.geo_score || 0), 0) / articles.length) : 0;

  const healthGood = articles.filter(a => (a.seo_score || 0) >= 70 && (a.aeo_score || 0) >= 60).length;
  const healthWarn = articles.filter(a => (a.seo_score || 0) >= 40 && (a.seo_score || 0) < 70).length;
  const healthBad  = articles.filter(a => (a.seo_score || 0) < 40).length;

  // Calendar grouping
  const calendarGroups: Record<string, any[]> = {};
  const calRows = allArticles.length ? allArticles : articles;
  for (const a of calRows) {
    if (!a.created_at) continue;
    const month = new Date(a.created_at).toLocaleDateString("id-ID", { year: "numeric", month: "long" });
    if (!calendarGroups[month]) calendarGroups[month] = [];
    calendarGroups[month].push(a);
  }

  // Health filter
  const healthRows = (allArticles.length ? allArticles : articles).filter(a => {
    if (healthFilter === "low_seo") return (a.seo_score || 0) < 60;
    if (healthFilter === "low_aeo") return (a.aeo_score || 0) < 50;
    if (healthFilter === "low_aio") return (a.geo_score || 0) < 50;
    if (healthFilter === "no_image") return !a.featured_image;
    return (a.seo_score || 0) < 60 || (a.aeo_score || 0) < 50 || (a.geo_score || 0) < 50;
  });

  const kwPending = keywords.filter(k => k.status === "pending").length;
  const kwDone    = keywords.filter(k => k.status === "done").length;
  const kwError   = keywords.filter(k => k.status === "error").length;
  const artPublished = articles.filter(a => a.status === "published").length;
  const artDraft     = articles.filter(a => a.status === "draft").length;

  const catCounts: Record<string, number> = {};
  for (const kw of keywords) catCounts[kw.category] = (catCounts[kw.category] || 0) + 1;

  const filteredKw = activeCatFilter === "All" ? keywords : keywords.filter(k => k.category === activeCatFilter);

  // ── Login ────────────────────────────────────────────────────────────────────
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

  // ── Main Layout ──────────────────────────────────────────────────────────────────
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
               page === "knowledge" ? "Knowledge Base" :
               page === "health" ? "Health Check" :
               page === "research" ? "Keyword Research" :
               page === "calendar" ? "Content Calendar" : "Settings"}
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

          {/* ── DASHBOARD ───────────────────────────────────────────────── */}
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

              {/* Score Overview */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "AVG SEO SCORE", value: avgSeo, thresh: 70, color: avgSeo >= 70 ? "text-emerald-600" : avgSeo >= 40 ? "text-amber-500" : "text-red-500" },
                  { label: "AVG AEO SCORE", value: avgAeo, thresh: 60, color: avgAeo >= 60 ? "text-emerald-600" : avgAeo >= 40 ? "text-amber-500" : "text-red-500" },
                  { label: "AVG AIO SCORE", value: avgAio, thresh: 60, color: avgAio >= 60 ? "text-emerald-600" : avgAio >= 40 ? "text-amber-500" : "text-red-500" },
                ].map(s => (
                  <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">{s.label}</div>
                    <div className={`text-3xl font-bold ${s.color}`}>{s.value}<span className="text-sm font-normal text-gray-300">/100</span></div>
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.color.replace("text-", "bg-").replace("-600","-500").replace("-500","-400")}`} style={{ width: `${s.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Content Health */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Content Health</div>
                  <button onClick={() => setPage("health")} className="text-xs text-indigo-500 hover:text-indigo-700">View All Issues →</button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Good", count: healthGood, color: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-400" },
                    { label: "Needs Attention", count: healthWarn, color: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-400" },
                    { label: "Critical", count: healthBad, color: "bg-red-50 border-red-200 text-red-600", dot: "bg-red-400" },
                  ].map(h => (
                    <div key={h.label} className={`border rounded-lg px-4 py-3 ${h.color}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${h.dot}`} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{h.label}</span>
                      </div>
                      <div className="text-2xl font-bold">{h.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Articles */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Recent Articles</div>
                  <button onClick={() => setPage("articles")} className="text-xs text-indigo-500 hover:text-indigo-700">View All →</button>
                </div>
                <div className="divide-y divide-gray-100">
                  {articles.slice(0, 5).map(a => (
                    <div key={a.id} className="flex items-center justify-between py-2.5 gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-800 font-medium truncate">{a.title || a.keyword}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{a.category} · {new Date(a.created_at).toLocaleDateString("id-ID")}</div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <ScoreBadge label="S" value={a.seo_score} />
                        <ScoreBadge label="A" value={a.aeo_score} />
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[a.status] || "bg-gray-100 text-gray-500"}`}>{a.status}</span>
                      </div>
                    </div>
                  ))}
                  {articles.length === 0 && <div className="text-center py-4 text-gray-400 text-sm">No articles yet</div>}
                </div>
              </div>
            </div>
          )}

          {/* ── KEYWORDS ────────────────────────────────────────────────── */}
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

              {/* Bulk Import */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowBulk(b => !b)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 text-left"
                >
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Bulk Import</div>
                  <span className="text-gray-400 text-xs">{showBulk ? "▲" : "▼"}</span>
                </button>
                {showBulk && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-3">
                    <p className="text-xs text-gray-400">Paste keywords, one per line. Will use selected Category & Intent from above.</p>
                    <textarea
                      value={bulkKwText}
                      onChange={e => setBulkKwText(e.target.value)}
                      placeholder={"cara setting google ads\nstrategi seo untuk pemula\ntips email marketing"}
                      rows={6}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 font-mono resize-none"
                    />
                    <div className="flex items-center gap-3">
                      <button
                        onClick={bulkImport}
                        disabled={bulkImporting || !bulkKwText.trim()}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                      >
                        {bulkImporting ? "Importing…" : `Import ${bulkKwText.split("\n").filter(l => l.trim()).length} Keywords`}
                      </button>
                      {bulkMsg && <span className="text-xs text-emerald-600 font-medium">{bulkMsg}</span>}
                    </div>
                  </div>
                )}
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

          {/* ── ARTICLES ────────────────────────────────────────────────── */}
          {page === "articles" && (
            <div className="space-y-4">
              {artLoading ? (
                <div className="text-center py-10 text-gray-400 text-sm">Loading…</div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs text-gray-500">{artTotal} articles total</div>
                    <button onClick={exportCSV} className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 bg-white px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                      ↓ Export CSV
                    </button>
                  </div>
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

          {/* ── LOGS ──────────────────────────────────────────────────────────── */}
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

          {/* ── KNOWLEDGE BASE ─────────────────────────────────────────────────── */}
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

          {/* ── HEALTH CHECK ─────────────────────────────────────────────────────────── */}
          {page === "health" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {[
                  { id: "all", label: "All Issues" },
                  { id: "low_seo", label: "Low SEO (<60)" },
                  { id: "low_aeo", label: "Low AEO (<50)" },
                  { id: "low_aio", label: "Low AIO (<50)" },
                  { id: "no_image", label: "No Image" },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setHealthFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${healthFilter === f.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}
                  >
                    {f.label}
                  </button>
                ))}
                <button
                  onClick={loadAllArticles}
                  disabled={allArtLoading}
                  className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                >
                  {allArtLoading ? "Loading…" : `↻ Load All (${allArticles.length || articles.length})`}
                </button>
              </div>

              {healthRows.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl py-12 text-center text-gray-400 text-sm">
                  No articles match this filter — great job!
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Article</th>
                        <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Scores</th>
                        <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Issues</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {healthRows.map(a => {
                        const issues = [];
                        if ((a.seo_score || 0) < 60) issues.push({ label: "SEO " + (a.seo_score || 0), tip: "Add more H2s, increase word count to 2000+, ensure keyword in title", color: "text-red-500 bg-red-50" });
                        if ((a.aeo_score || 0) < 50) issues.push({ label: "AEO " + (a.aeo_score || 0), tip: "Add FAQ section (5+ Q&A pairs), open with definition paragraph", color: "text-amber-600 bg-amber-50" });
                        if ((a.geo_score || 0) < 50) issues.push({ label: "AIO " + (a.geo_score || 0), tip: "Add 3+ statistics with sources, include comparison table", color: "text-purple-600 bg-purple-50" });
                        if (!a.featured_image) issues.push({ label: "No Image", tip: "Featured image missing — check Pexels API key", color: "text-gray-500 bg-gray-100" });
                        return (
                          <tr key={a.id} className="hover:bg-gray-50 align-top">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-800 max-w-xs truncate">{a.title || a.keyword}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">{a.category} · {new Date(a.created_at).toLocaleDateString("id-ID")}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <ScoreBadge label="SEO" value={a.seo_score} />
                                <ScoreBadge label="AEO" value={a.aeo_score} />
                                <ScoreBadge label="AIO" value={a.geo_score} />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-1.5">
                                {issues.map((issue, ii) => (
                                  <div key={ii}>
                                    <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${issue.color}`}>{issue.label}</span>
                                    <div className="text-[10px] text-gray-400 mt-0.5">{issue.tip}</div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">{healthRows.length} articles with issues</div>
                </div>
              )}
            </div>
          )}

          {/* ── KEYWORD RESEARCH ──────────────────────────────────────────────────── */}
          {page === "research" && (
            <div className="space-y-5 max-w-3xl">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Research Mode</div>

                <div className="flex gap-2 mb-4">
                  {[
                    { id: "expand", label: "🌱 Expand Keyword", desc: "Generate variations from a seed keyword" },
                    { id: "competitor", label: "🏆 Competitor Gap", desc: "Find keywords your competitor targets" },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setResearchType(t.id as any)}
                      className={`flex-1 text-left px-4 py-3 rounded-lg border text-xs transition ${researchType === t.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
                    >
                      <div className="font-semibold">{t.label}</div>
                      <div className="opacity-70 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={researchType === "competitor" ? "e.g. digimind.id, sribulancer.com" : "e.g. google ads, email marketing"}
                    value={researchSeed}
                    onChange={e => setResearchSeed(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && triggerResearch()}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
                  />
                  <select value={researchCat} onChange={e => setResearchCat(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-indigo-400">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <button
                    onClick={triggerResearch}
                    disabled={researchLoading || !researchSeed.trim()}
                    className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition whitespace-nowrap shadow-sm"
                  >
                    {researchLoading ? "Generating…" : "Generate"}
                  </button>
                </div>
                {researchMsg && <p className="text-xs text-red-500 mt-2">{researchMsg}</p>}
              </div>

              {researchResults.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{researchResults.length} Keyword Suggestions</div>
                    <button
                      onClick={async () => {
                        for (const kw of researchResults) await addResearchKw(kw);
                      }}
                      className="text-xs text-indigo-500 hover:text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50"
                    >
                      + Add All to Queue
                    </button>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Keyword</th>
                        <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest hidden sm:table-cell">Intent</th>
                        <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest hidden lg:table-cell">Why</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {researchResults.map((kw, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-800 font-medium">{kw.keyword}</td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                              kw.search_intent === "informational" ? "bg-blue-50 text-blue-600 border-blue-200" :
                              kw.search_intent === "commercial" ? "bg-orange-50 text-orange-600 border-orange-200" :
                              "bg-emerald-50 text-emerald-600 border-emerald-200"
                            }`}>{kw.search_intent}</span>
                          </td>
                          <td className="px-4 py-3 text-[10px] text-gray-400 hidden lg:table-cell max-w-xs truncate">{kw.reason}</td>
                          <td className="px-4 py-3">
                            {addedKws.has(kw.keyword) ? (
                              <span className="text-xs text-emerald-500 font-medium">✓ Added</span>
                            ) : (
                              <button onClick={() => addResearchKw(kw)} className="text-xs text-indigo-500 hover:text-indigo-700 border border-indigo-200 px-2 py-1 rounded hover:bg-indigo-50">
                                + Add
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── CONTENT CALENDAR ──────────────────────────────────────────────────── */}
          {page === "calendar" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-sm">{(allArticles.length || articles.length)} articles across {Object.keys(calendarGroups).length} months</p>
                <button onClick={loadAllArticles} disabled={allArtLoading} className="text-xs text-indigo-500 hover:text-indigo-700 border border-gray-200 px-3 py-1.5 rounded-lg bg-white">
                  {allArtLoading ? "Loading…" : "↻ Load All"}
                </button>
              </div>

              {Object.keys(calendarGroups).length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl py-12 text-center text-gray-400 text-sm">No articles yet</div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(calendarGroups).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime()).map(([month, arts]) => (
                    <div key={month} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                        <div className="text-sm font-semibold text-gray-700">{month}</div>
                        <div className="text-xs text-gray-400">{arts.length} articles</div>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {arts.map(a => (
                          <div key={a.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
                              {new Date(a.created_at).getDate()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-800 font-medium truncate">{a.title || a.keyword}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">{a.category} · {a.word_count?.toLocaleString() || "—"} words</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <ScoreBadge label="SEO" value={a.seo_score} />
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[a.status] || "bg-gray-100 text-gray-500"}`}>{a.status}</span>
                              {a.slug && <a href={`/blog/${a.slug}`} target="_blank" className="text-[10px] text-gray-300 hover:text-gray-500">↗</a>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SETTINGS ────────────────────────────────────────────────────────────────── */}
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
