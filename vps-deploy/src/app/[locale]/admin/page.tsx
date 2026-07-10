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
    title: "RankMath SEO Score: Panduan Lengkap",
    icon: "📊",
    content: `## Sistem Scoring RankMath (0–100)

![RankMath SEO Score Dashboard](https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=280&fit=crop&auto=format)

RankMath mengukur kualitas SEO artikel melalui **4 kategori pengujian**. Skor hijau (81+) berarti artikel siap ranking. Kuning (51–80) perlu optimasi lanjutan. Merah (<50) butuh revisi mendasar.

| Kategori | Jumlah Tes | Bobot |
|---|---|---|
| Basic SEO | 7 tes | Terpenting — fondasi ranking |
| Additional SEO | 9 tes | Pelengkap — meningkatkan edge |
| Title Readability | 4 tes | CTR — klik lebih banyak |
| Content Readability | 3 tes | UX — user betah di halaman |

---

## Basic SEO Tests (Wajib Lulus Semua)

### 8.1 Focus Keyword di SEO Title
Keyword utama harus muncul di SEO title (bukan post title). Target: keyword di dalam **50 karakter pertama** title. Contoh baik: "Panduan Google Ads untuk Pemula — Nuswalab".

### 8.2 Focus Keyword di Meta Description
Keyword utama harus ada di meta description. Panjang ideal **120–160 karakter**. Keyword sebaiknya muncul di **120 karakter pertama** agar tidak terpotong di SERP.

### 8.3 Focus Keyword di URL/Slug
Slug harus mengandung keyword utama. Gunakan format: `/panduan-google-ads` bukan `/post-123`. Hindari stopword (dan, atau, yang, di, ke).

### 8.4 Focus Keyword di Awal Konten
Keyword utama harus muncul di **10% pertama artikel**. Untuk artikel 2000 kata = 200 kata pertama. Jika artikel di bawah 300 kata, seluruh konten dicek.

### 8.5 Focus Keyword di Body Konten
Semua focus keyword (primer & sekunder) harus muncul dalam body artikel secara natural. Test ini berjalan untuk semua keyword yang didaftarkan.

### 8.6 Panjang Konten (Content Length)

| Panjang Artikel | Skor Test |
|---|---|
| 2500+ kata | 100% ✅ |
| 2000–2500 kata | 70% 🟡 |
| 1500–2000 kata | 60% 🟡 |
| 1000–1500 kata | 40% 🔴 |
| 600–1000 kata | 20% 🔴 |
| Di bawah 600 kata | 0% ❌ |

**Target minimum artikel: 2500 kata** untuk skor sempurna di tes ini.

---

## Additional SEO Tests

### 10.1 Keyword di Subheading (H2/H3)
Keyword primer DAN sekunder harus muncul di setidaknya satu H2 atau H3. Ini juga membantu Google membuat sitelinks (jump links) di SERP yang meningkatkan CTR.

### 10.2 Keyword di Alt Text Gambar
Alt text gambar harus mengandung keyword primer. Baik singular maupun plural diterima. Contoh: alt="panduan google ads indonesia".

### 10.3 Keyword Density (1%–1.5%)
Densitas keyword ideal: **1%–1.5%**. Di bawah 1% = terlalu jarang (skor rendah). Di atas 2.5% = keyword stuffing (peringatan merah). RankMath cek keyword primer dan sekunder.

### 10.4 URL Length (≤75 karakter)
Total URL termasuk domain harus ≤75 karakter. Jika domain panjang, tes ini bisa diabaikan. Contoh: `https://nuswalab.com/panduan-google-ads` = 40 karakter ✅

### 10.5 & 10.6 External Links (Followed)
Artikel harus punya minimal 1 link keluar ke sumber terpercaya (Google, HubSpot, Semrush, etc.). Link harus berstatus **dofollow** (bukan nofollow). Ini sinyal natural content ke Google.

### 10.7 Internal Links
Artikel harus punya minimal 1 internal link ke artikel lain di website. Ideal: 2–3 internal link per artikel untuk distribusi PageRank.

### 10.8 Focus Keyword Uniqueness
Jangan gunakan keyword yang sama di lebih dari 1 artikel. Duplikasi keyword = keyword cannibalization. RankMath akan memberi peringatan jika keyword sudah dipakai di artikel lain.

---

## Title Readability Tests

### 12.1 Keyword di Awal Title (50% Pertama)
Keyword primer harus ada di **50% pertama** SEO title. Jika title 60 karakter, keyword harus muncul di 30 karakter pertama. Contoh: "Google Ads untuk Pemula: Panduan Lengkap 2025".

### 12.2 Sentimen di Title
Title harus membangkitkan emosi kuat (positif atau negatif). Hindari clickbait. Contoh: "7 Kesalahan Fatal Google Ads yang Membakar Budget Anda" → emosi kuat ✅

### 12.3 Power Word di Title
Gunakan kata-kata yang memaksa orang klik: **Terbukti, Rahasia, Lengkap, Gratis, Cepat, Mudah, Ampuh, Terbaru**. RankMath punya daftar power words internal yang terus diperbarui.

### 12.4 Angka di Title
Title dengan angka mendapat lebih banyak klik. Contoh: "10 Strategi Google Ads Terbukti 2025" vs "Strategi Google Ads". Yang pertama selalu menang CTR.

---

## Content Readability Tests

### 14.1 Table of Contents
Artikel panjang harus punya daftar isi. Google mungkin menampilkan "Jump to" links di SERP yang meningkatkan CTR drastis. Gunakan plugin TOC atau buat manual.

### 14.2 Paragraf Pendek (Maks 120 Kata)
**Tidak ada paragraf yang boleh melebihi 120 kata.** Paragraf panjang = wall of text = pembaca kabur. RankMath akan highlight paragraf yang terlalu panjang.

### 14.3 Media (Gambar/Video)

| Jumlah Media | Skor |
|---|---|
| 0 gambar/video | Gagal ❌ |
| 1 gambar/video | Lulus (skor partial) |
| 4+ gambar/video | Skor 100% ✅ |

---

## Quick Wins untuk Skor 100/100

- ✅ Tulis minimal 2500 kata per artikel
- ✅ Keyword di title, meta, URL, 200 kata pertama
- ✅ Keyword density 1%–1.5%
- ✅ Minimal 4 gambar dengan alt text keyword
- ✅ Title pakai angka + power word + keyword di awal
- ✅ Paragraf maks 120 kata, ada TOC
- ✅ 2–3 internal link + 1 external dofollow link`,
  },
  {
    title: "SEO Modern 2025: E-E-A-T & Topical Authority",
    icon: "🏆",
    content: `## Strategi SEO Modern 2025

![Modern SEO Strategy 2025](https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&h=280&fit=crop&auto=format)

SEO di 2025 bukan lagi soal keyword stuffing. Google mengevaluasi konten berdasarkan **E-E-A-T** dan **Topical Authority** — dua pilar yang menentukan apakah situs Anda layak ranking di halaman 1.

---

## 1. E-E-A-T Framework Google

**E-E-A-T** = Experience, Expertise, Authoritativeness, Trustworthiness. Digunakan Google Search Quality Raters untuk menilai konten, terutama untuk topik YMYL (finance, health, marketing).

### Experience (Pengalaman Langsung)
Konten yang ditulis berdasarkan pengalaman nyata mendapat nilai lebih tinggi.
- Gunakan contoh riil: "Ketika kami mengelola kampanye klien e-commerce dengan budget Rp 10 juta..."
- Sertakan data sebelum-sesudah: "CTR naik dari 1.2% ke 3.8% setelah optimasi"
- Pakai sudut pandang orang pertama: "Berdasarkan pengalaman kami mengelola 50+ akun Google Ads..."

### Expertise (Keahlian Mendalam)
- Gunakan terminologi industri yang benar: CPC, ROAS, Quality Score, Ad Rank, CTR
- Jelaskan nuansa: "Google Ads menggunakan second-price auction, artinya Anda tidak selalu bayar bid maksimal"
- Referensikan Google's official documentation atau blog resmi Google
- Hindari oversimplifikasi — akui edge cases dan pengecualian

### Authoritativeness (Otoritas Brand)
- **Backlink strategy**: Guest post di Glints, IDN Times, Detik Finance, Kompas Tekno
- **Social proof**: Sebut jumlah klien, tahun berpengalaman, penghargaan
- **Content depth**: Terbitkan panduan paling komprehensif di setiap topik

### Trustworthiness (Kepercayaan)
- Cite sumber: "Menurut laporan Think with Google 2024..."
- Akui keterbatasan: "Google Ads tidak cocok untuk semua jenis bisnis"
- Update konten: Tambahkan "Terakhir diperbarui: [bulan tahun]"
- Sertakan statistik dengan sumber dan tahun yang jelas

---

## 2. Topical Authority & Pillar-Cluster Strategy

Google memahami topik secara semantik, bukan sekadar keyword. Bangun topical authority dengan struktur pillar-cluster:

### Arsitektur Konten yang Benar

**Pillar Page** (Panduan Induk — 4000+ kata):
- "Panduan Lengkap Google Ads untuk Bisnis Indonesia"
- Mencakup semua subtopik secara overview
- Berisi link ke semua cluster pages

**Cluster Pages** (Artikel Detail — 2000+ kata):
- "Cara Setting Google Ads untuk UMKM"
- "Panduan Bidding Google Ads Terbaru"
- "Google Ads vs Meta Ads: Mana Lebih Efektif?"
- Semua link balik ke pillar page

### Manfaat Topical Authority
- Google menganggap situs Anda sebagai "expert" di niche tersebut
- Artikel baru lebih cepat ranking karena trust domain sudah tinggi
- Meningkatkan impressi untuk semua keyword terkait, bukan hanya yang ditarget

---

## 3. Search Intent Alignment

Penyebab utama konten tidak ranking: **mismatch search intent**.

| Intent | Format Konten | Contoh Query |
|---|---|---|
| Informational | Long-form guide, how-to | "apa itu google ads" |
| Commercial | Comparison, review | "google ads vs facebook ads" |
| Transactional | Landing page, CTA-focused | "jasa google ads jakarta" |
| Navigational | Brand/service page | "nuswalab digital marketing" |

**Cara identifikasi intent**: Lihat 5 hasil teratas Google untuk keyword target. Jika semua adalah artikel panduan, buat artikel panduan. Jika semua adalah halaman produk, buat landing page.

---

## 4. Struktur Konten untuk Ranking

- **SEO Title**: Keyword + power word + tahun. Maks 60 karakter. Keyword di 30 karakter pertama
- **Meta Description**: 150–160 karakter. Keyword + benefit jelas + CTA
- **H1**: Exact-match atau close variant keyword target
- **H2s**: Pakai format pertanyaan (siapa, apa, mengapa, bagaimana, kapan) — cocok dengan "People Also Ask"
- **200 kata pertama**: Sebutkan keyword dan janjikan apa yang akan dipelajari pembaca
- **Konklusi**: Ringkasan + CTA + internal link ke halaman layanan

---

## 5. Core Web Vitals (Technical SEO)

Sinyal ranking Google sejak 2021:

| Metrik | Target | Cara Optimasi |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5 detik | Optimize gambar (WebP, lazy load) |
| INP (Interaction to Next Paint) | < 200ms | Minimasi blocking JavaScript |
| CLS (Cumulative Layout Shift) | < 0.1 | Set width/height gambar, hindari ads dinamis |

---

## 6. Local SEO untuk Pasar Indonesia

- Gunakan variasi keyword Bahasa Indonesia: "cara", "panduan", "tips", "terbaik", "murah"
- Target "[layanan] + [kota]": "jasa SEO Surabaya", "digital marketing Bandung"
- Daftarkan Google Business Profile untuk ranking local pack
- Dapatkan citation dari direktori Indonesia (Tokopedia, Yellow Pages ID, Kaskus bisnis)

---

## Checklist Artikel SEO-Optimized

- [ ] SEO title: keyword di 30 karakter pertama, ada power word dan tahun
- [ ] Meta description 150–160 karakter dengan keyword dan CTA
- [ ] Slug pendek berisi keyword (≤75 karakter total URL)
- [ ] Keyword di 200 kata pertama artikel
- [ ] Minimal 2500 kata
- [ ] Keyword density 1%–1.5%
- [ ] Minimal 4 gambar dengan alt text keyword
- [ ] 2–3 internal link + 1 external dofollow link
- [ ] FAQ section untuk "People Also Ask"
- [ ] Tidak ada paragraf > 120 kata`,
  },
  {
    title: "AEO Strategy & Scoring",
    icon: "🤖",
    content: `## AEO Score Calculation

![Answer Engine Optimization - Featured Snippets](https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&h=280&fit=crop&auto=format)

AEO (Answer Engine Optimization) menargetkan voice search, featured snippets, dan kutipan asisten AI:

| Cek Konten | Poin |
|---|---|
| Ada FAQ section (5+ Q&A) | +30 |
| Ada paragraf definisi di awal | +20 |
| Ada daftar langkah bernomor | +20 |
| Menjawab "apa itu" / "cara" | +15 |
| Kalimat pendek dan langsung | +15 |

**Target: 60+ untuk dikutip asisten AI dan masuk featured snippet.**

---

## Apa itu AEO?

Answer Engine Optimization adalah praktik menyusun konten agar asisten AI (Siri, Alexa, Google Assistant), voice search, dan featured snippet Google dapat mengekstrak dan menampilkan jawaban Anda **langsung tanpa perlu diklik**.

---

## 1. Featured Snippet Optimization

Featured snippet (posisi zero) adalah target utama AEO. Ada tiga tipe snippet:

### Paragraph Snippets (Paling Umum)
- Jawab pertanyaan di **40–60 kata pertama** sebuah seksi
- Mulai dengan: "X adalah..." atau "X merupakan..." untuk query definisi
- Ikuti langsung dengan 2–3 kalimat pendukung

### List Snippets
- Gunakan daftar bernomor untuk query "cara", "langkah", "tips"
- Setiap poin maksimal 10 kata
- Ideal: 5–8 poin per daftar

### Table Snippets
- Gunakan untuk query perbandingan ("X vs Y", "perbedaan A dan B")
- Tabel sederhana: 2–4 kolom, header jelas

---

## 2. FAQ Schema Markup

FAQ schema adalah kunci AEO — Q&A Anda muncul langsung di Google SERP:

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Apa itu Google Ads?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Google Ads adalah platform periklanan berbayar dari Google yang memungkinkan bisnis menampilkan iklan di hasil pencarian Google dan jaringan mitranya."
    }
  }]
}
\`\`\`

- Minimum **5 Q&A per artikel**
- Pertanyaan harus sesuai dengan query nyata di Google (cek "People Also Ask")
- Jawaban: 40–300 kata, langsung dan faktual

---

## 3. Optimasi Voice Search

Query voice search lebih **conversational** dan lebih panjang dari typing:

- Target bahasa natural: "bagaimana cara setting Google Ads untuk pemula"
- Gunakan H2 format pertanyaan: "Berapa Biaya Google Ads per Bulan?"
- Jawab LANGSUNG setelah heading pertanyaan (tanpa preamble panjang)
- Local queries: optimalkan untuk "[layanan] di [kota]"

---

## 4. "People Also Ask" (PAA) Optimization

PAA box muncul di 40%+ pencarian Google dan mendorong visibilitas AEO signifikan:

- Research PAA boxes untuk keyword target Anda
- Buat seksi H2 khusus menjawab setiap PAA question
- Format: pertanyaan sebagai H3, jawaban 2–3 kalimat langsung setelahnya

---

## 5. Struktur Konten Conversational

Asisten AI lebih suka konten yang terdengar seperti menjawab langsung ke seseorang:

**LAKUKAN:**
- "Google Ads bekerja dengan cara..."
- "Untuk memulai, Anda perlu..."
- "Langkah pertama adalah..."

**HINDARI:**
- Paragraf intro panjang sebelum jawaban
- Kalimat pasif yang berbelit
- Bahasa ambigu ("mungkin", "bisa jadi", "tergantung")

---

## 6. Struktur Jawaban Ideal (PAS Framework)

**P = Problem**: Sebutkan masalah yang dihadapi pembaca
**A = Answer**: Berikan jawaban langsung dan jelas
**S = Support**: Dukung dengan data, contoh, atau langkah-langkah

Contoh untuk query "cara meningkatkan CTR Google Ads":

> **P**: CTR Google Ads yang rendah berarti Anda membuang budget tanpa hasil.
> **A**: Cara paling efektif meningkatkan CTR adalah dengan menulis headline yang spesifik, relevan, dan mengandung angka atau manfaat jelas.
> **S**: Dalam pengujian kami terhadap 50 akun, headline yang menyebut benefit spesifik ("Hemat 30% Biaya Iklan") mendapat CTR 2.4x lebih tinggi dari headline generik.

---

## Quick Wins untuk Skor AEO Tinggi

- ✅ Selalu sertakan seksi ## FAQ dengan 5+ Q&A
- ✅ Buka artikel dengan definisi 2 kalimat yang jelas tentang topik
- ✅ Gunakan daftar bernomor untuk semua konten "how to"
- ✅ Tambahkan FAQ JSON-LD schema di article head
- ✅ Samakan H2 headings dengan format pertanyaan PAA Google
- ✅ Jawab setiap pertanyaan dalam 40–60 kata pertama seksi`,
  },
  {
    title: "AIO / GEO Strategy & Scoring",
    icon: "✨",
    content: `## AIO Score Calculation

![AI Overview and GEO Strategy](https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=280&fit=crop&auto=format)

AIO (AI Overview / GEO — Generative Engine Optimization) menargetkan Google AI Overviews dan kutipan LLM:

| Cek Konten | Poin |
|---|---|
| Menyebut statistik dengan sumber | +25 |
| Menyebut sumber otoritatif | +20 |
| Ada tabel perbandingan | +20 |
| Ada structured data | +15 |
| Sudut pandang expert disebut | +20 |

**Target: 60+ untuk masuk AI Overview dan dikutip LLM.**

---

## Apa yang Berubah: Google AI Overviews

Google AI Overviews (sebelumnya SGE) diluncurkan global 2024. Alih-alih 10 link biru, Google kini mensintesis jawaban dari berbagai sumber web di bagian atas SERP. **Dikutip = eksposur masif tanpa perlu diklik.**

---

## 1. GEO Content Framework

Riset Princeton/Georgia Tech (2024) mengidentifikasi sinyal yang disukai AI untuk dikutip:

| Sinyal | Impact | Cara Implementasi |
|---|---|---|
| Statistik dengan sumber | Sangat Tinggi | "Menurut laporan HubSpot 2024, 72% marketer..." |
| Kutipan dari expert | Tinggi | Sertakan nama expert yang dikutip |
| Referensi riset | Tinggi | Rujuk Google, Semrush, McKinsey reports |
| Kelancaran & kejelasan | Sedang | Paragraf pendek, kalimat aktif |
| Insight unik | Tinggi | Data first-person, analisis original |

---

## 2. Pola Konten yang Layak Dikutip AI

LLM (GPT, Claude, Gemini) dan Google AI Overviews lebih suka mengutip konten yang:

### Punya Klaim Terverifikasi
- ✅ "CTR rata-rata iklan display adalah 0.1% (Google, 2024)"
- ❌ "CTR iklan display sangat rendah"

### Menyajikan Perbandingan Terstruktur

| Tool | Kelebihan | Kekurangan | Biaya |
|---|---|---|---|
| Google Ads | Reach terluas, intent tinggi | Mahal, kurva belajar curam | Rp 3.000–50.000/klik |
| Meta Ads | Visual, targeting demografi | Intent lebih rendah | Rp 500–5.000/klik |
| TikTok Ads | Viral potential, Gen Z | Brand awareness mainly | Rp 300–3.000/klik |

### Menyebut Perspektif Expert
- "Neil Patel merekomendasikan..."
- "Menurut Rand Fishkin dari SparkToro..."
- "Pakar SEO Indonesia setuju bahwa..."

---

## 3. Structured Data untuk AI

Structured data membantu AI memahami entitas dalam konten Anda:

**Article schema**: Author, datePublished, organization, image
**HowTo schema**: Untuk panduan langkah-demi-langkah
**FAQPage schema**: Untuk seksi FAQ
**BreadcrumbList**: Untuk sinyal hierarki konten
**Organization schema**: Untuk E-E-A-T brand

---

## 4. Kedalaman & Komprehensivitas Konten

Sistem AI lebih suka konten yang membahas topik secara **menyeluruh**:

- **Topik utama**: 60% konten fokus pada topik inti
- **Subtopik**: Bahas semua angle terkait (mengapa, bagaimana, kapan, siapa, biaya, contoh)
- **Counter-argument**: Akui keterbatasan ("Google Ads tidak cocok untuk bisnis X karena...")
- **Next steps**: Selalu rekomendasikan tindak lanjut yang bisa diambil

---

## 5. Freshness Signals

AI Overviews sangat menyukai konten segar:

- Sertakan tahun di title: "Panduan Google Ads 2025"
- Sebut update terbaru: "Setelah pembaruan Google Helpful Content 2024..."
- Update artikel lama dengan statistik baru (re-publish date penting)
- Tambahkan "Terakhir diperbarui: [bulan tahun]" dekat bagian atas

---

## 6. Multi-Modal Signals

- **Gambar dengan alt text deskriptif**: "infografis cara kerja google ads bidding 2025"
- **Embed video**: Artikel dengan video mendapat 3x lebih banyak kutipan AI Overview
- **Data visualisasi**: Grafik dan chart yang dijelaskan dalam teks

---

## Quick Wins untuk Skor AIO Tinggi

- ✅ Sertakan 3+ statistik dengan sumber dan tahun dalam tanda kurung
- ✅ Tambahkan minimal 1 tabel perbandingan per artikel
- ✅ Sebutkan 1–2 nama expert atau lembaga riset industri
- ✅ Tambahkan Article + FAQ JSON-LD schema
- ✅ Tulis konten yang komprehensif — hindari thin content
- ✅ Sertakan "updated [tahun]" di title atau meta description`,
  },
  {
    title: "Keyword Strategy Guide",
    icon: "🎯",
    content: `## Strategi Pemilihan Keyword

![Keyword Research Strategy](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=280&fit=crop&auto=format)

---

## Berdasarkan Search Intent

| Intent | Tujuan | Format Konten | Contoh |
|---|---|---|---|
| Informational | Edukasi / top of funnel | Panduan panjang, how-to | "apa itu google ads" |
| Commercial | Riset sebelum beli | Perbandingan, review | "google ads vs facebook ads" |
| Transactional | Drive konversi | Landing page, CTA | "jasa google ads terpercaya" |
| Navigational | Brand searches | Halaman layanan/brand | "nuswalab digital marketing" |

---

## Keyword Difficulty vs. Opportunity Matrix

| Zona | KD | Volume | Strategi |
|---|---|---|---|
| Quick Wins | Rendah (0–30) | Sedang | Publish cepat, ranking 1–3 bulan |
| Long-term | Tinggi (60+) | Tinggi | Bangun authority perlahan |
| Niche Gold | Rendah (0–30) | Rendah | Effort rendah, konversi tinggi |
| Hindari | Tinggi (60+) | Rendah | Tidak sebanding usahanya |

---

## Prioritas Kategori untuk Nuswalab

1. **Google Ads** — Intent komersial tinggi, langsung sesuai layanan
2. **SEO** — Long-tail, volume tinggi informational
3. **Social Media Marketing** — Audiens luas, konten shareable
4. **Digital Marketing** — Umbrella terms, brand awareness
5. **Content Marketing** — Thought leadership, sinyal E-E-A-T
6. **Email Marketing** — Niche tapi conversion intent tinggi

---

## Formula Keyword Long-tail

Long-tail keywords (3–5 kata) menyumbang 70% dari semua pencarian:

\`\`\`
[modifier] + [keyword utama] + [qualifier]

"cara" + "setting google ads" + "untuk pemula"
"tips" + "seo" + "terbaru 2025"
"strategi" + "email marketing" + "meningkatkan konversi"
\`\`\`

---

## Keyword Mix Strategy

- **60% Informational** — "apa itu", "cara", "panduan", "tips" → mendorong organic traffic
- **30% Commercial** — "terbaik", "rekomendasi", "vs", "perbandingan" → mendorong leads
- **10% Transactional** — "jasa", "harga", "biaya", "hire" → mendorong konversi

---

## Varian Bahasa Indonesia

Selalu generate varian Bahasa Indonesia:
- **Formal**: "strategi pemasaran digital"
- **Informal**: "cara belajar digital marketing"
- **Gaul/kolokial**: "tips iklan fb biar laris"
- **Lokal**: "[keyword] + [kota]" untuk local intent

---

## Proses Keyword Research

1. Seed keyword → expand dengan "apa itu", "cara", "tips", "terbaik", "2025"
2. Cek Google Autocomplete + PAA boxes untuk pertanyaan terkait
3. Validasi dengan tools gratis: Ubersuggest, Google Keyword Planner, Ahrefs free
4. Kelompokkan berdasarkan intent sebelum masuk ke queue

---

## Keyword Cannibalization: Bahaya Duplikasi

Satu keyword hanya boleh ditarget oleh **satu artikel**. Jika dua artikel targeting keyword sama:
- Google bingung mana yang harus diranking
- Kedua artikel saling kanibalisasi
- Solusi: merge artikel atau ubah focus keyword salah satunya

**RankMath akan memberi peringatan** (test 10.8: Focus Keyword Uniqueness) jika keyword sudah dipakai di artikel lain.`,
  },
  {
    title: "Article Generation Workflow",
    icon: "🔄",
    content: `## Alur Kerja Generator Artikel

![Article Generation Workflow](https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=280&fit=crop&auto=format)

\`\`\`
keywords.json (status: pending)
    ↓
OpenAI-compatible API (claude-sonnet-5)
    ↓ 2500+ kata artikel Bahasa Indonesia
Pexels API → Featured image
    ↓
Scoring: SEO / AEO / AIO
    ↓
SQLite insert (status = published)
    ↓
Mark keyword as done
    ↓
npm build + pm2 restart
\`\`\`

---

## Menjalankan Generator

1. Buka **Keyword Queue** dan tambah keyword dengan status pending
2. Klik **▶ Run Generator** di header admin
3. Cek **Run Logs** untuk progress real-time
4. Artikel muncul di **All Articles** setelah selesai

### Jadwal Cron
Generator berjalan otomatis setiap hari pukul **19:00 WIB**:

\`\`\`
0 19 * * * cd /home/ubuntu/nuswalab && node scripts/keyword-article-gen.js >> logs/article-gen.log 2>&1
\`\`\`

---

## Struktur Prompt Optimal untuk Skor Tinggi

Agar artikel mencapai skor SEO/AEO/AIO maksimal, prompt harus meminta:

1. **Paragraf definisi** di 100 kata pertama — keyword sebagai subjek kalimat (AEO)
2. **Minimal 2500 kata** — untuk skor 100% di RankMath content length test (SEO)
3. **Daftar bernomor** untuk semua konten "how to" (AEO)
4. **3+ statistik** dengan sumber dalam tanda kurung (AIO)
5. **1 tabel perbandingan** (AIO)
6. **5+ Q&A FAQ** di akhir artikel (AEO + AIO)
7. **Keyword** di H1 dan 2 H2 pertama (SEO — Basic test 8.4 & Additional test 10.1)
8. **Alt text keyword** di deskripsi gambar (SEO — Additional test 10.2)

---

## Konfigurasi API (openagentic.id)

| Setting | Value |
|---|---|
| Base URL | https://openagentic.id/api/v1 |
| Model | claude-sonnet-5 |
| Max tokens | 8000 |
| Format | OpenAI-compatible chat completions |

Set di `/home/ubuntu/nuswalab/.env.local`:
\`\`\`
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://openagentic.id/api/v1
OPENAI_MODEL=claude-sonnet-5
\`\`\`

---

## Rate Limits & Batasan

- Maks **3 artikel per run** (configurable di script)
- openagentic.id: sesuai tier akun
- Pexels: 200 req/jam, 20.000 req/bulan

---

## Quality Checklist (Post-Generation)

- [ ] SEO score ≥ 70? (idealnya 81+ untuk hijau)
- [ ] AEO score ≥ 60?
- [ ] AIO score ≥ 60?
- [ ] Featured image loaded dari Pexels?
- [ ] Tidak ada statistik yang dikarang AI (halusinasi)?
- [ ] FAQ section ada dengan ≥ 5 Q&A?
- [ ] Panjang artikel ≥ 2500 kata?
- [ ] Tidak ada keyword cannibalization (keyword unik per artikel)?`,
  },
  {
    title: "Internal Linking & Site Architecture",
    icon: "🔗",
    content: `## Strategi Internal Linking

![Internal Linking and Site Architecture](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=280&fit=crop&auto=format)

Internal link mendistribusikan PageRank (link equity), meningkatkan crawlability, dan membuat user lebih lama di site — semua sinyal ranking positif.

RankMath akan **gagalkan test 10.7** jika tidak ada internal link sama sekali dalam artikel.

---

## Arsitektur Site: Flat vs. Deep

**Flat architecture (direkomendasikan untuk SEO):**

\`\`\`
Homepage
├── /blog/panduan-google-ads (Pillar)
│   ├── /blog/cara-setting-google-ads (Cluster)
│   └── /blog/google-ads-untuk-umkm (Cluster)
└── /blog/panduan-seo (Pillar)
    ├── /blog/teknik-seo-onpage (Cluster)
    └── /blog/cara-riset-keyword (Cluster)
\`\`\`

- Tidak ada artikel yang lebih dari **3 klik dari homepage**
- Pillar pages link ke semua cluster pages
- Cluster pages link balik ke pillar + ke cluster terkait

---

## Penempatan Internal Link

**High-value placements (PageRank terbesar):**
1. Dalam 200 kata pertama artikel (editorial context = nilai tertinggi)
2. Di dalam body text dengan anchor text deskriptif
3. Seksi "Artikel Terkait" di akhir konten

**Hindari:**
- Widget "related posts" di sidebar/footer (nilai rendah)
- Terlalu banyak link dalam satu paragraf (dilute value)
- Link di menu navigasi saja (crawl links, bukan editorial)

---

## Anchor Text Best Practices

| Tipe | Contoh | Frekuensi |
|---|---|---|
| Exact match | "panduan google ads" | Jarang (1–2x per site) |
| Partial match | "strategi google ads terbaik" | Paling umum, natural |
| Branded | "layanan Nuswalab" | Untuk service pages |
| Generic | "klik di sini" | HINDARI — tidak ada sinyal keyword |
| Naked URL | "nuswalab.com/blog/..." | Sesekali OK |

---

## Minimum Internal Link per Artikel

- **Setiap artikel**: 2–3 internal link ke artikel terkait
- **Pillar articles**: 5–8 link ke cluster articles
- **Category pages**: Link ke semua artikel dalam kategori itu
- **Homepage**: Link ke 5 pillar article teratas

---

## PageRank Flow Strategy

1. Identifikasi **artikel dengan traffic tertinggi** (cek Google Search Console)
2. Tambahkan internal link DARI artikel high-traffic KE artikel baru atau lower-traffic
3. Ini "meneruskan" authority untuk membantu konten baru ranking lebih cepat

---

## Crawl Efficiency

- Submit updated sitemap ke Google Search Console setelah setiap batch publish
- Pastikan semua artikel muncul di `/sitemap.xml`
- Fix broken internal links setiap bulan (crawl dengan Screaming Frog free tier)

---

## Implementasi di Article Generator

Tambahkan ke Claude prompt: "Akhiri artikel dengan seksi 'Artikel Terkait' yang menyarankan 2–3 topik terkait dari kategori [nama kategori]. Gunakan anchor text deskriptif yang mengandung keyword target."

---

## Internal Linking & RankMath Score

RankMath test 10.7 mensyaratkan minimal 1 internal link per artikel. Untuk skor sempurna:
- ✅ 2–3 internal link ke artikel berbeda
- ✅ Anchor text mengandung keyword natural
- ✅ Link ke halaman dengan topik relevan (bukan asal link)`,
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
    } else if (line.match(/^!\[(.*)]\((.*)\)$/)) {
      const m = line.match(/^!\[(.*?)]\((.*?)\)$/);
      if (m) {
        elements.push(
          <img key={i} src={m[2]} alt={m[1]} className="w-full rounded-lg my-3 object-cover max-h-48" loading="lazy" />
        );
      }
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
