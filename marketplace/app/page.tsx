import Link from "next/link";
import "./home.css";
import { db } from "@/lib/db";
import HomeFX from "@/components/HomeFX";

export const dynamic = "force-dynamic";

async function settingNumber(key: string, fallback: number): Promise<number> {
  const s = await db.setting.findUnique({ where: { key } });
  const v = s ? parseFloat(s.value) : NaN;
  return Number.isFinite(v) ? v : fallback;
}

const FEATURES = [
  { ic: "ic-teal", icon: "⚡", title: "Bayar QRIS & VA otomatis", desc: "QRIS + Virtual Account (BNI, BRI, Mandiri, Permata, CIMB). Order lunas sendiri, tanpa cek mutasi manual." },
  { ic: "ic-emerald", icon: "📦", title: "Fisik & digital", desc: "Kirim barang lewat kurir, atau jual produk digital yang terkirim otomatis via link download aman." },
  { ic: "ic-amber", icon: "💰", title: "Saldo & tarik dana", desc: "Tiap penjualan masuk saldo toko. Tarik ke rekening kapan saja, riwayat mutasi transparan." },
  { ic: "ic-sky", icon: "🚚", title: "Kurir & kirim instan", desc: "Ongkir & resi otomatis. Termasuk kirim sameday via Gojek, Grab, dan Lalamove." },
  { ic: "ic-coral", icon: "🎟️", title: "Voucher & flash sale", desc: "Bikin promo sendiri: voucher persen/nominal, kuota, dan harga kejutan berbatas waktu." },
  { ic: "ic-sky", icon: "🎯", title: "Tracking iklan Meta", desc: "Meta Pixel + Conversions API bawaan. Iklan FB/IG-mu jadi akurat dan tidak boncos.", uniq: true },
  { ic: "ic-violet", icon: "🤝", title: "Program afiliasi", desc: "Atur komisi per produk. Biarkan orang lain ikut memasarkan dan menjualkan produkmu." },
  { ic: "ic-emerald", icon: "🏷️", title: "Grosir, varian & add-on", desc: "Harga grosir bertingkat, varian warna/ukuran, dan order bump untuk menaikkan nilai belanja." },
  { ic: "ic-teal", icon: "📊", title: "Analitik funnel", desc: "Lihat di mana calon pembeli berhenti dan dari mana mereka datang — bukan sekadar jumlah view." },
];

const GALLERY = [
  { img: "/home/gal-madu.svg", t: "Madu Hutan", pr: "Rp85.000" },
  { img: "/home/gal-kopi.svg", t: "Kopi Gayo", pr: "Rp120.000" },
  { img: "/home/gal-serum.svg", t: "Serum Wajah", pr: "Rp95.000" },
  { img: "/home/gal-sambal.svg", t: "Sambal Roa", pr: "Rp48.000" },
];

export default async function HomePage() {
  const [price, feeStd, feePro] = await Promise.all([
    settingNumber("pro_monthly_price", 49000),
    settingNumber("platform_fee_percent", 5),
    settingNumber("platform_fee_percent_pro", 3),
  ]);
  const savings = Math.max(0, feeStd - feePro);

  return (
    <div className="nm-home">
      {/* HERO */}
      <header className="hero">
        <div className="mesh"><div className="orb a" /><div className="orb b" /><div className="orb c" /></div>
        <div className="nm-wrap hero-grid">
          <div>
            <div className="badge-pill reveal in"><span className="dot">✨</span> Kini dengan AI Studio untuk foto &amp; caption</div>
            <h1 className="hero-h reveal in d1">Foto produk sekelas <span className="gtext ai">studio</span>, toko online yang <span className="gtext">tumbuh sendiri</span>.</h1>
            <p className="hero-sub reveal in d2">Buka toko brand-mu di NuswaMart — lengkap dengan AI, pembayaran otomatis, kurir, dan alat marketing. Semua dalam satu tempat.</p>
            <div className="hero-cta reveal in d3">
              <Link className="btn btn-primary btn-lg" href="/register-seller">Buka Toko Gratis →</Link>
              <a className="btn btn-outline btn-lg" href="#fitur">Lihat semua fitur</a>
            </div>
            <div className="hero-note reveal in d4">
              <span><span className="ck">✓</span> Gratis selamanya</span>
              <span><span className="ck">✓</span> Produk tanpa batas</span>
              <span><span className="ck">✓</span> Tanpa kartu kredit</span>
            </div>
          </div>

          <div className="stage">
            <div className="deck" id="nm-deck">
              <div className="panel">
                <div className="panel-top"><i /><i /><i /><span className="url">tokokamu.nuswamart.com</span></div>
                <div className="panel-body">
                  <div className="mini-row"><span className="mini-title">Ringkasan Toko</span><span className="mini-tag">● Live</span></div>
                  <div className="stat-cards">
                    <div className="scard"><div className="k">Penjualan</div><div className="v up">Rp4,8jt</div></div>
                    <div className="scard"><div className="k">Pesanan</div><div className="v up">128</div></div>
                    <div className="scard"><div className="k">Pengunjung</div><div className="v">2.104</div></div>
                  </div>
                  <div className="chart">
                    <div className="bar" style={{ height: "40%", animationDelay: ".1s" }} />
                    <div className="bar" style={{ height: "62%", animationDelay: ".18s" }} />
                    <div className="bar" style={{ height: "48%", animationDelay: ".26s" }} />
                    <div className="bar" style={{ height: "78%", animationDelay: ".34s" }} />
                    <div className="bar" style={{ height: "66%", animationDelay: ".42s" }} />
                    <div className="bar" style={{ height: "92%", animationDelay: ".5s" }} />
                    <div className="bar" style={{ height: "74%", animationDelay: ".58s" }} />
                  </div>
                </div>
              </div>
              <div className="chip3d chip-ai"><span className="ic">✨</span><div>Foto AI siap<small>3 detik</small></div></div>
              <div className="chip3d chip-pay"><span className="ic">⚡</span><div>QRIS lunas<small>otomatis</small></div></div>
              <div className="chip3d chip-wa"><span className="ic">✓</span><div>Notif WA terkirim<small>ke pembeli</small></div></div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="hero-photo"><span className="tag">✨ Foto AI</span><img src="/home/hero-jar.svg" alt="Contoh foto produk hasil AI Studio" /></div>
            </div>
          </div>
        </div>
      </header>

      {/* STRIP */}
      <div className="strip">
        <div className="nm-wrap in">
          <span className="lab">Semua yang dibutuhkan seller</span>
          <span className="item"><span className="g" style={{ background: "var(--teal)" }} />Bayar QRIS &amp; VA</span>
          <span className="item"><span className="g" style={{ background: "var(--violet)" }} />AI Studio</span>
          <span className="item"><span className="g" style={{ background: "var(--amber)" }} />Kurir &amp; Resi</span>
          <span className="item"><span className="g" style={{ background: "var(--coral)" }} />Voucher &amp; Flash Sale</span>
          <span className="item"><span className="g" style={{ background: "var(--sky)" }} />Tracking Iklan Meta</span>
        </div>
      </div>

      {/* AI SPOTLIGHT */}
      <section className="blk ai-blk" id="ai">
        <div className="nm-wrap ai-grid">
          <div className="reveal">
            <div className="ba">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="half before"><img src="/home/before.svg" alt="Foto produk sebelum diproses AI" /><span className="lbl">Sebelum</span></div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="half after"><img src="/home/after.svg" alt="Foto produk sesudah AI Studio" /><span className="lbl">Sesudah · AI</span></div>
              <div className="divider" />
            </div>
            <div className="cap-demo">
              <div className="head"><span className="spark">✨</span> Caption dibuat otomatis</div>
              <div className="typed" id="nm-typed"><span className="cursor" /></div>
            </div>
          </div>
          <div className="reveal d1">
            <p className="eyebrow ai">✨ NuswaMart AI Studio</p>
            <h2 className="sec">Tak perlu fotografer. Tak perlu bingung nulis.</h2>
            <p className="sec-lead">Ubah foto produk seadanya jadi tampilan profesional, dan biarkan AI merangkai deskripsi yang menjual — langsung dari dashboard tokomu.</p>
            <ul className="ai-points">
              <li><span className="n">📸</span><div><b>Foto produk profesional</b><p>Percantik foto dengan AI. Hemat ratusan ribu tiap sesi foto, hasil siap tayang dalam hitungan detik.</p></div></li>
              <li><span className="n">✍️</span><div><b>Caption &amp; deskripsi otomatis</b><p>Dari nama produk jadi deskripsi jualan yang rapi dan meyakinkan — cocok untuk yang bingung merangkai kata.</p></div></li>
              <li><span className="n">🎟️</span><div><b>Sistem kredit yang adil</b><p>Ada jatah gratis untuk mulai, lalu topup kredit sesuai kebutuhan. Bayar hanya yang kamu pakai.</p></div></li>
            </ul>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="blk">
        <div className="nm-wrap center">
          <p className="eyebrow ai reveal">✨ Hasil AI Studio</p>
          <h2 className="sec reveal d1">Begini tampilan produkmu — siap tayang &amp; menjual</h2>
          <p className="sec-lead reveal d2">Foto rapi dan konsisten bikin toko terlihat profesional sejak produk pertama. Semua ini dibuat langsung dari dashboard.</p>
        </div>
        <div className="nm-wrap">
          <div className="gallery">
            {GALLERY.map((g, i) => (
              <div className={`gal-card reveal${i ? ` d${i}` : ""}`} key={g.t}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className="im"><span className="aitag">✨ AI</span><img src={g.img} alt={`Foto produk ${g.t}`} /></div>
                <div className="cap"><span className="t">{g.t}</span><span className="pr">{g.pr}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section className="blk" id="fitur">
        <div className="nm-wrap center">
          <p className="eyebrow reveal">Semua alat dalam satu tempat</p>
          <h2 className="sec reveal d1">Bukan cuma tempat jualan — perlengkapan lengkap untuk tumbuh</h2>
          <p className="sec-lead reveal d2">Dari pembayaran otomatis sampai senjata marketing. Semua sudah siap pakai begitu tokomu dibuka.</p>
        </div>
        <div className="nm-wrap">
          <div className="fgrid">
            {FEATURES.map((f, i) => (
              <div className={`fcard reveal${i % 3 ? ` d${i % 3}` : ""}`} key={f.title}>
                {f.uniq ? <span className="uniq">Unik</span> : null}
                <div className={`ic ${f.ic}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STORE BRAND */}
      <section className="blk brand-blk" id="toko">
        <div className="nm-wrap brand-grid">
          <div className="reveal">
            <p className="eyebrow">Toko brand sendiri</p>
            <h2 className="sec">Bukan listing generik. Ini tokomu.</h2>
            <p className="sec-lead">Susun tampilan halaman toko lewat blok siap pakai, pasang domain sendiri, dan bangun kepercayaan dengan badge terverifikasi.</p>
            <ul className="brand-list">
              <li><span className="ck">✓</span><div><b>Store builder drag-block</b><span>Atur banner promo, produk pilihan, dan bagian lain sesukamu.</span></div></li>
              <li><span className="ck">✓</span><div><b>Custom domain</b><span>Pakai domain sendiri — toko terasa seperti website brand milikmu.</span></div></li>
              <li><span className="ck">✓</span><div><b>Badge Terverifikasi (KYC)</b><span>Verifikasi identitas jadi sinyal aman bagi pembeli.</span></div></li>
              <li><span className="ck">✓</span><div><b>Link siap bagikan</b><span>Sebar ke WhatsApp, Instagram, dan TikTok dalam sekali klik.</span></div></li>
            </ul>
          </div>
          <div className="reveal d1">
            <div className="storefront">
              <div className="sf-banner" />
              <div className="sf-ava">🛍️</div>
              <div className="sf-info"><div className="nm">Toko Rempah Nusantara <span className="vf">✔</span></div><div className="mt">⭐ 4.9 · 1.2rb produk terjual · Terverifikasi</div></div>
              <div className="sf-prods">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className="p"><div className="im"><img src="/home/gal-madu.svg" alt="Madu Hutan" /></div><div className="tx"><div className="t">Madu Hutan</div><div className="pr">Rp85.000</div></div></div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className="p"><div className="im"><img src="/home/gal-kopi.svg" alt="Kopi Gayo" /></div><div className="tx"><div className="t">Kopi Gayo</div><div className="pr">Rp120.000</div></div></div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className="p"><div className="im"><img src="/home/gal-serum.svg" alt="Serum Wajah" /></div><div className="tx"><div className="t">Serum Wajah</div><div className="pr">Rp95.000</div></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="blk">
        <div className="nm-wrap center">
          <p className="eyebrow reveal">Cara kerja</p>
          <h2 className="sec reveal d1">Buka toko dalam 3 langkah</h2>
          <p className="sec-lead reveal d2">Tak sampai satu menit sampai tokomu siap menerima pesanan pertama.</p>
        </div>
        <div className="nm-wrap">
          <div className="steps">
            <div className="step reveal"><div className="no">1</div><h3>Daftar &amp; buka toko</h3><p>Masuk dengan email atau Google, isi nama toko. Gratis, tak sampai satu menit.</p><span className="arrow">→</span></div>
            <div className="step reveal d1"><div className="no">2</div><h3>Pasang produk</h3><p>Upload produk fisik atau digital. Biar AI yang bantu foto &amp; deskripsinya.</p><span className="arrow">→</span></div>
            <div className="step reveal d2"><div className="no">3</div><h3>Terima pembayaran</h3><p>Pembeli bayar via QRIS/VA, saldo masuk otomatis, tarik ke rekeningmu.</p></div>
          </div>
        </div>
      </section>

      {/* PRICING (auto dari pengaturan admin) */}
      <section className="blk brand-blk" id="harga">
        <div className="nm-wrap center">
          <p className="eyebrow reveal">Harga transparan</p>
          <h2 className="sec reveal d1">Mulai gratis. Naik ke Pro saat siap.</h2>
          <p className="sec-lead reveal d2">Tanpa biaya tersembunyi. Kamu hanya membayar fee kecil per transaksi yang berhasil.</p>
        </div>
        <div className="nm-wrap">
          <div className="price-grid">
            <div className="plan reveal">
              <div className="tier">Paket Gratis</div>
              <div className="price">Rp0</div>
              <div className="cap">Untuk mulai berjualan tanpa risiko.</div>
              <ul>
                <li><span className="c">✓</span> Jualan tanpa batas produk</li>
                <li><span className="c">✓</span> Semua fitur inti &amp; AI Studio</li>
                <li><span className="c">✓</span> Notifikasi WhatsApp otomatis</li>
                <li><span className="c">✓</span> Fee platform {feeStd}% per transaksi</li>
              </ul>
              <Link className="btn btn-outline" href="/register-seller" style={{ width: "100%", justifyContent: "center" }}>Buka Toko Gratis</Link>
            </div>
            <div className="plan pro reveal d1">
              <span className="popular">Populer</span>
              <div className="tier">Paket Pro</div>
              <div className="price">Rp{price.toLocaleString("id-ID")}<small>/bln</small></div>
              <div className="cap">Untuk yang mau tumbuh lebih serius.</div>
              <ul>
                <li><span className="c">⚡</span> Fee turun jadi {feePro}%{savings > 0 ? ` — hemat ${savings}% tiap penjualan` : ""}</li>
                <li><span className="c">⭐</span> Badge Toko Pro</li>
                <li><span className="c">📈</span> Prioritas dukungan</li>
                <li><span className="c">✓</span> Semua fitur paket gratis</li>
              </ul>
              <Link className="btn btn-primary" href="/dashboard/subscription" style={{ width: "100%", justifyContent: "center", background: "var(--grad-warm)", boxShadow: "0 14px 34px rgba(255,106,77,.3)" }}>Coba Pro</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="cta-blk">
        <div className="nm-wrap">
          <div className="cta-card reveal">
            <h2>Tokomu, siap dibuka hari ini.</h2>
            <p>Gabung NuswaMart dan mulai jualan dengan perlengkapan lengkap — gratis, tanpa batas produk, tanpa kartu kredit.</p>
            <Link className="btn btn-white btn-lg" href="/register-seller">Buka Toko Gratis →</Link>
          </div>
        </div>
      </section>

      <HomeFX />
    </div>
  );
}
