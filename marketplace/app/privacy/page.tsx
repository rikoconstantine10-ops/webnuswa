export const metadata = { title: "Kebijakan Privasi — NuswaMart" };

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 prose prose-slate prose-sm">
      <h1 className="text-2xl font-extrabold">Kebijakan Privasi</h1>
      <p className="text-slate-500">Bagaimana NuswaMart mengelola data kamu.</p>

      <h2 className="font-bold mt-6">Data yang Kami Kumpulkan</h2>
      <p>Nama, email, nomor WhatsApp, alamat pengiriman, dan data rekening penjual. Data transaksi disimpan untuk keperluan pesanan, pengiriman, dan pembayaran.</p>

      <h2 className="font-bold mt-6">Penggunaan Data</h2>
      <p>Data digunakan untuk memproses pesanan, menghitung ongkir, mengirim notifikasi (email/WhatsApp), dan mendukung layanan pelanggan. Data identitas penjual hanya dipakai untuk verifikasi.</p>

      <h2 className="font-bold mt-6">Berbagi Data</h2>
      <p>Data pengiriman dibagikan ke mitra kurir (Biteship) untuk pengantaran. Data pembayaran diproses oleh gateway pembayaran. Kami tidak menjual data pribadi kamu.</p>

      <h2 className="font-bold mt-6">Pelacakan Iklan</h2>
      <p>Penjual dapat memasang Meta Pixel di tokonya. Aktivitas kunjungan dapat dilacak untuk kebutuhan iklan penjual sesuai kebijakan masing-masing.</p>

      <h2 className="font-bold mt-6">Keamanan &amp; Hak Kamu</h2>
      <p>Kami menjaga data dengan enkripsi HTTPS. Kamu dapat meminta koreksi atau penghapusan data melalui halaman Bantuan.</p>
    </div>
  );
}
