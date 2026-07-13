import { requireAdmin } from "@/lib/auth";
import { getPlatformFeePercent } from "@/lib/ledger";
import { kieAiEnabled } from "@/lib/kieai";
import AdminSettingsForm from "@/components/AdminSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const [fee, kieApiKeySet] = await Promise.all([getPlatformFeePercent(), kieAiEnabled()]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Pengaturan Platform</h1>
      <AdminSettingsForm currentFee={fee} kieApiKeySet={kieApiKeySet} />
    </div>
  );
}
