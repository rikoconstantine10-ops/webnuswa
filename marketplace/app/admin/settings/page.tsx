import { requireAdmin } from "@/lib/auth";
import { getPlatformFeePercent } from "@/lib/ledger";
import AdminSettingsForm from "@/components/AdminSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const fee = await getPlatformFeePercent();

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Pengaturan Platform</h1>
      <AdminSettingsForm currentFee={fee} />
    </div>
  );
}
