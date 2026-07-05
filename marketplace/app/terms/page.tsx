export const metadata = { title: "Syarat & Ketentuan — NuswaMart" };

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 prose prose-slate prose-sm">
      <h1 className="text-2xl font-extrabold">Syarat &amp; Ketentuan</h1>
      <p className="text-slate-500">Berlaku di NuswaMart (nuswamart.com).</p>

      <h2 className="font-bold mt-6">1. Tentang Layanan</h2>
      <p>NuswaMart adalah marketplace yang mempertemukan penjual (UMKM) dan pembeli untuk produk digital maupun fisik. NuswaMart menyediakan platform, sistem pembayaran terpusat, dan integrasi pengiriman.</p>

      <h2 className="font-bold mt-6">2. Akun &amp; Verifikasi</h2>
      <p>Penjual wajib melakukan verifikasi identitas (KYC) sebelum dana dapat dicairkan. Pembeli bertanggung jawab menjaga kerahasiaan akunnya.</p>

      <h2 className="font-bold mt-6">3. Pembayaran &amp; Dana Ditahan (Escrow)</h2>
      <p>Pembayaran diproses melalui gateway resmi. Untuk produk fisik, dana ditahan platform dan baru diteruskan ke penjual setelah pembeli menerima pesanan atau setelah masa konfirmasi berakhir. Produk digital diteruskan segera setelah pembayaran.</p>

      <h2 className="font-bold mt-6">4. Pengembalian &amp; Sengketa</h2>
      <p>Pembeli dapat mengajukan komplain untuk pesanan yang bermasalah. Admin akan memediasi dan memutuskan pengembalian dana atau penerusan dana ke penjual.</p>

      <h2 className="font-bold mt-6">5. Biaya Platform</h2>
      <p>NuswaMart memungut biaya platform per transaksi yang dipotong otomatis dari penjualan penjual.</p>

      <h2 className="font-bold mt-6">6. Larangan</h2>
      <p>Dilarang menjual barang ilegal, melanggar hak cipta, atau menyalahgunakan platform. Pelanggaran dapat berujung penonaktifan toko.</p>

      <p className="text-xs text-slate-400 mt-8">Dokumen ini dapat diperbarui sewaktu-waktu. Untuk pertanyaan, hubungi kami melalui halaman Bantuan.</p>
    </div>
  );
}
