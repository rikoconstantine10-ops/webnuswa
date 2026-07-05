export const metadata = { title: "Bantuan — NuswaMart" };

const FAQ = [
  { q: "Bagaimana cara berbelanja?", a: "Cari produk di halaman Belanja, buka produk, lalu klik Beli Sekarang atau Masukkan Keranjang. Selesaikan pembayaran melalui QRIS atau Virtual Account." },
  { q: "Apakah dana saya aman?", a: "Untuk produk fisik, dana kamu ditahan platform (escrow) dan baru diteruskan ke penjual setelah kamu menerima barang atau setelah masa konfirmasi berakhir." },
  { q: "Bagaimana jika barang tidak sampai atau rusak?", a: "Buka halaman pesananmu dan klik 'Ajukan Komplain'. Admin akan memediasi dan bisa memutuskan pengembalian dana." },
  { q: "Bagaimana cara berjualan?", a: "Klik 'Buka Toko', lengkapi profil toko, lakukan verifikasi identitas (KYC), lalu tambahkan produk. Produk dari penjual terverifikasi langsung tayang." },
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
      <p className="text-sm text-slate-500 mt-8">
        Butuh bantuan lain? Hubungi kami di{" "}
        <a href="mailto:cs@nuswamart.com" className="text-teal-600 font-semibold">cs@nuswamart.com</a>.
      </p>
    </div>
  );
}
