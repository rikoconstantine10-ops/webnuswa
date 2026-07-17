import { requireSeller } from "@/lib/auth";
import InboxClient from "@/components/InboxClient";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  await requireSeller();

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-1">Inbox</h1>
      <p className="text-sm text-slate-500 mb-4">
        Percakapan WA pembeli. Bot balas otomatis kalau yakin; kalau tidak, percakapan pindah ke
        &quot;Butuh kamu&quot; dan kamu bisa ambil alih kapan saja.
      </p>
      <InboxClient />
    </div>
  );
}
