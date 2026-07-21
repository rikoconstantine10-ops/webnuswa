export const metadata = { title: "Bantuan — NuswaMart" };

const FAQ = [
  { q: "Bagaimana cara berbelanja?", a: "Cari produk di halaman Belanja, buka produk, lalu klik Beli Sekarang atau Masukkan Keranjang. Selesaikan pembayaran melalui QRIS atau Virtual Account." },
  { q: "Apakah dana saya aman?", a: "Untuk produk fisik, dana kamu ditahan platform (escrow) dan baru diteruskan ke penjual setelah kamu menerima barang atau setelah masa konfirmasi berakhir." },
  { q: "Bagaimana jika barang tidak sampai atau rusak?", a: "Buka halaman pesananmu dan klik 'Ajukan Komplain'. Admin akan memediasi dan bisa memutuskan pengembalian dana." },
  { q: "Bagaimana cara berjualan?", a: "Klik 'Buka Toko', lengkapi profil toko & rekening, lalu tambahkan produk. Produk langsung tayang di marketplace — tanpa proses verifikasi yang ribet." },
  { q: "Bagaimana pencairan dana penjual?", a: "Saldo tersedia (dana yang sudah dirilis dari escrow) dapat ditarik ke rekening bank melalui menu Saldo & Penarikan di dashboard." },
];

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-extrabold mb-2">Pusat Bantuan</h1>
      <p className="text-slate-500 mb-6">Pertanyaan yang sering diajukan.</p>
      <div className="space-y-3">
        {FAQ.map((f) => (
          <details key={f.q} className="bg-white rounded-xl border border-slate-200 p-4">
            <summary className="font-semibold cursor-pointer">{f.q}</summary>
            <p className="text-sm text-slate-600 mt-2">{f.a}</p>
          </details>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 mt-8 text-sm text-slate-600 space-y-1">
        <p className="font-semibold text-slate-800">Butuh bantuan lain? Hubungi kami:</p>
        <p>
          Pesanan &amp; komplain:{" "}
          <a href="mailto:support@nuswamart.com" className="text-teal-600 font-semibold">support@nuswamart.com</a>
        </p>
        <p>
          Dukungan penjual:{" "}
          <a href="mailto:seller@nuswamart.com" className="text-teal-600 font-semibold">seller@nuswamart.com</a>
        </p>
        <p>
          Tagihan &amp; penarikan dana:{" "}
          <a href="mailto:billing@nuswamart.com" className="text-teal-600 font-semibold">billing@nuswamart.com</a>
        </p>
        <p>
          Pertanyaan umum:{" "}
          <a href="mailto:hello@nuswamart.com" className="text-teal-600 font-semibold">hello@nuswamart.com</a>
        </p>
      </div>
    </div>
  );
}
