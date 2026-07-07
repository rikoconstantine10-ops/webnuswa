import urllib.request, json, sys

TK = sys.argv[1]
API = "http://localhost:3001"
H = {"Authorization": "Bearer " + TK, "Content-Type": "application/json"}

def post(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(API + path, data=body, headers=H, method="POST")
    try:
        r = urllib.request.urlopen(req, timeout=10)
        print("OK:", path, json.loads(r.read()).get("ok") or json.loads(r.read()))
    except Exception as e:
        print("ERR:", path, str(e))

def add_kb(title, content):
    body = json.dumps({"title": title, "content": content}).encode()
    req = urllib.request.Request(API + "/api/knowledge", data=body, headers=H, method="POST")
    try:
        r = urllib.request.urlopen(req, timeout=10)
        d = json.loads(r.read())
        print("KB OK:", title, "id=", d.get("id"))
    except Exception as e:
        print("KB ERR:", title, str(e))

def set_setting(key, val):
    body = json.dumps({key: val}).encode()
    req = urllib.request.Request(API + "/api/settings", data=body, headers=H, method="POST")
    try:
        r = urllib.request.urlopen(req, timeout=10)
        print("SET OK:", key)
    except Exception as e:
        print("SET ERR:", key, str(e))

# 1. System Prompt
set_setting("system_prompt", """Kamu adalah NuswaBot, asisten AI resmi dari Nuswalab - agensi digital marketing terpercaya di Indonesia yang melayani 100+ klien.

IDENTITAS:
- Nama: NuswaBot
- Perusahaan: Nuswalab (nuswalab.com)
- Jam layanan: 09:00-18:00 WIB, Senin-Sabtu
- Kontak: WhatsApp +62 851-8130-1622

TUGAS UTAMA:
- Jawab pertanyaan tentang layanan Nuswalab dengan ramah dan informatif
- Bantu calon klien memahami layanan dan manfaatnya
- Arahkan ke konsultasi gratis untuk yang tertarik
- Jawab singkat dan natural seperti chat WhatsApp
- Gunakan bahasa Indonesia yang santai tapi profesional
- Gunakan emoji secukupnya

LAYANAN UTAMA:
1. Facebook & Instagram Ads (unggulan, rata-rata ROAS 4-8x)
2. Google Ads (Google Partner certified, traffic naik hingga 300%)
3. SEO (tingkatkan traffic organik)
4. Social Media Management
5. CRM & Marketing Automation
6. Landing Page & CRO (konversi naik 2-5x)

PANDUAN HARGA:
- Mulai dari Rp 3 juta/bulan
- Selalu tawarkan konsultasi gratis untuk detail harga
- Management fee ~15% dari budget iklan

TOOLS GRATIS yang bisa ditawarkan:
- Marketing Audit: nuswalab.com/tools/audit
- ROI Calculator: nuswalab.com/tools/roi-calculator

PENTING:
- Gunakan knowledge base untuk jawaban detail dan spesifik
- Jika tidak tahu, jangan mengarang - tawarkan untuk tanya ke tim langsung
- Selalu akhiri dengan CTA konsultasi jika relevan: hubungi +62 851-8130-1622""")

# 2. Bot name
set_setting("bot_name", "NuswaBot")

# 3. Knowledge Base entries
add_kb("Profil Nuswalab", """Nuswalab adalah agensi digital marketing terpercaya di Indonesia yang fokus pada performance marketing berbasis data.

Keunggulan Nuswalab:
- 100+ klien aktif dari berbagai industri
- Tim bersertifikat Google Partner
- Pendekatan berbasis data dan hasil terukur
- Dashboard laporan real-time untuk semua klien
- Hasil nyata: rata-rata ROAS 4-8x untuk klien Facebook Ads

Industri yang dilayani:
- E-commerce & Fashion
- Food & Beverage (F&B)
- Properti & Developer
- Klinik & Kesehatan
- Pendidikan Online
- SaaS & Teknologi

Jam Operasional: 09:00 - 18:00 WIB, Senin - Sabtu
Kontak WhatsApp: +62 851-8130-1622
Website: nuswalab.com""")

add_kb("Layanan Facebook dan Instagram Ads", """Layanan Facebook & Instagram Ads adalah layanan UNGGULAN Nuswalab.

Yang termasuk dalam layanan:
- Riset audience dan buyer persona mendalam
- Pembuatan brief creative iklan (copywriting, konsep desain)
- Setup campaign, ad set, dan targeting yang presisi
- Optimasi harian berdasarkan data performa
- A/B testing creative (video vs carousel vs static)
- Setup Facebook Pixel & conversion tracking
- Retargeting cart abandoner dan website visitor
- Lookalike Audience dari data purchaser
- Integrasi TikTok Ads jika diperlukan

Hasil rata-rata klien:
- ROAS rata-rata: 4-8x
- E-commerce Fashion: ROAS dari 1.2x → 4.8x dalam 2 bulan
- Klinik Kecantikan: booking dari 45 → 312/bulan dalam 4 bulan
- F&B Chain: revenue online dari Rp 32jt → Rp 187jt dalam 3 bulan

Cocok untuk: e-commerce, fashion, klinik, kuliner, properti, pendidikan, semua bisnis yang ingin leads dan sales lewat Meta.""")

add_kb("Layanan Google Ads", """Layanan Google Ads Nuswalab dikelola oleh tim bersertifikat Google Partner.

Yang termasuk dalam layanan:
- Riset kata kunci (keyword research) komprehensif
- Setup Search Ads, Display Ads, dan Shopping Ads
- Optimasi Quality Score dan Ad Rank
- Setup konversi via Google Tag Manager
- Negative keyword management
- Laporan performa mingguan dan bulanan

Keunggulan:
- Tim bersertifikat Google Partner (bukan sembarang agensi)
- Traffic website bisa naik hingga 300%
- Cost per lead lebih efisien
- Cocok dikombinasikan dengan SEO

Hasil klien:
- Online Education: CPA turun dari Rp 280.000 → Rp 68.000 (-76%) dalam 2 bulan
- Traffic website rata-rata naik 300%

Cocok untuk: bisnis jasa, pendidikan, properti, B2B, semua yang butuh leads dari pencarian Google.""")

add_kb("Layanan SEO, Social Media, CRM, Landing Page", """SEO (Search Engine Optimization):
- Tingkatkan peringkat website di Google secara organik
- Cocok dikombinasikan dengan Google Ads
- Hasil terlihat dalam 3-6 bulan

Social Media Management:
- Pengelolaan konten Instagram, Facebook, TikTok
- Content calendar, desain konten, copywriting caption
- Engagement management dan community building
- Laporan performa bulanan

CRM & Marketing Automation:
- Setup sistem CRM untuk manajemen leads dan pelanggan
- Otomasi follow-up email dan WhatsApp
- Pipeline sales management
- Cocok untuk bisnis dengan volume leads tinggi

Landing Page & CRO (Conversion Rate Optimization):
- Desain dan development landing page yang convert
- A/B testing elemen halaman
- Heatmap analysis dan user behavior tracking
- Rata-rata konversi naik 2-5x setelah optimasi
- Cocok dikombinasikan dengan iklan untuk hasil maksimal""")

add_kb("Harga dan Paket Layanan Nuswalab", """Harga layanan Nuswalab disesuaikan dengan kebutuhan dan skala bisnis.

Estimasi biaya:
- Mulai dari Rp 3 juta/bulan untuk paket dasar
- Management fee sekitar 15% dari budget iklan bulanan

Contoh estimasi budget:
- Budget iklan Rp 5 juta/bulan → management fee ~Rp 750.000
- Budget iklan Rp 10 juta/bulan → management fee ~Rp 1,5 juta
- Budget iklan Rp 30 juta/bulan → management fee ~Rp 4,5 juta

Rentang budget klien:
- Starter: < Rp 5 juta/bulan
- Growth: Rp 5-20 juta/bulan  
- Scale: Rp 20-50 juta/bulan
- Enterprise: > Rp 50 juta/bulan (harga custom)

CATATAN PENTING:
- Harga final ditentukan setelah konsultasi gratis
- Setiap bisnis punya kebutuhan berbeda, harga disesuaikan
- Tidak ada kontrak jangka panjang yang memaksa
- Konsultasi GRATIS, tanpa komitmen apapun

Untuk penawaran harga yang tepat sesuai kebutuhan bisnis kamu:
WhatsApp: +62 851-8130-1622 (jam 09:00-18:00 WIB, Senin-Sabtu)""")

add_kb("Portofolio dan Hasil Nyata Klien", """Hasil nyata yang dicapai klien Nuswalab (data terverifikasi):

1. E-commerce Fashion
   - ROAS: 1.2x → 4.8x (+300%)
   - Durasi: 2 bulan
   - Platform: Facebook & Instagram Ads

2. Property Developer
   - Cost Per Lead: Rp 450.000 → Rp 87.000 (-81%)
   - Durasi: 3 bulan

3. Klinik Kecantikan
   - Monthly Bookings: 45 → 312 per bulan (+593%)
   - Durasi: 4 bulan

4. F&B Chain
   - Online Revenue: Rp 32 juta → Rp 187 juta per bulan (+484%)
   - Durasi: 3 bulan

5. SaaS Platform
   - Trial Signups: 120 → 890 per bulan (+641%)
   - Durasi: 6 bulan

6. Online Education
   - CPA: Rp 280.000 → Rp 68.000 (-76%)
   - Durasi: 2 bulan

Case Study Detail - FashionID (6 bulan):
- Bulan 1: Setup & Launch, ROAS 1.4x - 3 ad sets pertama live
- Bulan 2: Optimasi Agresif, ROAS 2.1x - A/B test 12 variasi creative, CPA turun 34%
- Bulan 3: Scaling, Revenue Rp 87jt - budget naik 50%, ROAS stabil 2.8x
- Bulan 4: Peak Performance, ROAS 4.2x - retargeting cart abandoner, konversi 18%
- Bulan 5: Diversifikasi, Revenue Rp 212jt - ekspansi ke TikTok Ads
- Bulan 6: Final, ROAS 4.8x - revenue +340%, CPA -81%

Total klien aktif: 100+ (50+ e-commerce, 20+ properti, 30+ F&B & lifestyle)""")

add_kb("Tools Gratis dari Nuswalab", """Nuswalab menyediakan 2 tools GRATIS untuk membantu evaluasi marketing bisnis kamu:

1. FREE Marketing Audit Tool
   Link: nuswalab.com/tools/audit
   
   Cara kerja:
   - 3 langkah mudah: isi info bisnis → jawab 8 pertanyaan → lihat hasil
   - Pertanyaan mencakup: website mobile-friendly, Meta/Google Ads aktif, conversion tracking, konten rutin, email list/CRM, A/B testing, retargeting, dan awareness terhadap CPL
   - Menghasilkan Marketing Health Score (0-100)
   
   Interpretasi score:
   - 0-40: Perlu Perhatian - banyak yang bisa dioptimalkan
   - 41-70: Berkembang - sudah ada progress, masih ada ruang improvement
   - 71-100: Sudah Bagus - pertahankan dan scale up
   
   Setelah audit, tim Nuswalab bisa bantu buat strategi lengkap berdasarkan hasil audit kamu.

2. Marketing ROI Calculator
   Link: nuswalab.com/tools/roi-calculator
   
   Cara kerja:
   - Input: budget iklan bulanan, industri, ROAS saat ini, target pertumbuhan
   - Output: estimasi ROAS setelah optimasi, potensi revenue bulanan, peningkatan revenue tahunan, pengurangan CPL, payback period
   
   Benchmark ROAS per industri:
   - E-commerce: 3.2x | Fashion: 2.8x | F&B: 2.5x
   - Properti: 4.1x | Pendidikan: 3.5x | Kesehatan: 3.0x | SaaS: 3.8x

Kedua tools ini 100% GRATIS dan tidak ada kewajiban apapun setelah menggunakannya.""")

add_kb("Dashboard Klien dan Pelaporan", """Semua klien Nuswalab mendapatkan akses dashboard laporan real-time.

Akses Dashboard: dashboard.nuswalab.com/client

Fitur Dashboard Klien:
- Update data otomatis setiap 24 jam
- Total Spend - total pengeluaran iklan
- ROAS - Return on Ad Spend real-time
- Leads - jumlah leads yang dihasilkan
- CPL - Cost Per Lead terkini
- Grafik trend revenue 30 hari terakhir
- Bar chart leads per minggu
- Tabel semua kampanye aktif (nama, status, spend, ROAS, leads)
- Akses dari HP maupun laptop/desktop
- Data 100% rahasia dan aman

Keuntungan:
- Pantau performa iklan kapan saja dan di mana saja
- Tidak perlu tunggu laporan bulanan dari tim
- Transparansi penuh - klien bisa lihat semua data secara langsung
- Bisa bandingkan performa antar periode""")

add_kb("FAQ Pertanyaan Umum Nuswalab", """Q: Berapa lama kontrak minimum?
A: Tidak ada kontrak minimum yang memaksa. Untuk hasil optimal, kami rekomendasikan minimal 3 bulan karena iklan digital perlu waktu optimasi dan learning phase.

Q: Apakah Nuswalab menjamin hasil tertentu?
A: Kami tidak bisa menjamin angka spesifik karena hasil dipengaruhi banyak faktor (produk, pasar, budget, dll). Namun track record kami menunjukkan peningkatan signifikan rata-rata dalam 2-3 bulan.

Q: Apakah saya perlu website untuk beriklan?
A: Untuk Google Ads dan Meta Ads tujuan konversi, website sangat disarankan. Untuk awareness dan engagement, bisa tanpa website.

Q: Industri apa saja yang bisa dilayani?
A: Semua industri. Pengalaman terbanyak di: e-commerce, fashion, F&B, properti, klinik/kesehatan, pendidikan, SaaS/tech.

Q: Apa bedanya Nuswalab dengan agensi lain?
A: Nuswalab fokus pada performance (hasil terukur), bukan sekedar keliatan aktif. Setiap keputusan berbasis data, klien punya akses dashboard real-time, dan tim bersertifikat Google Partner.

Q: Bagaimana sistem pembayaran?
A: Monthly retainer yang dibahas detail saat konsultasi, disesuaikan dengan kebutuhan dan layanan yang dipilih.

Q: Berapa lama proses setup awal?
A: Rata-rata 7-14 hari kerja untuk riset, setup, dan approval sebelum campaign pertama live.

Q: Apakah bisa hanya pakai 1 layanan saja?
A: Bisa. Namun untuk hasil optimal, kombinasi beberapa layanan (misalnya Meta Ads + Landing Page) biasanya lebih efektif.

Q: Bagaimana cara memulai?
A: Mudah! Hubungi kami via WhatsApp +62 851-8130-1622, ceritakan bisnis kamu, dan kami akan jadwalkan konsultasi gratis.""")

print("===ALL KNOWLEDGE BASE ENTRIES ADDED===")
