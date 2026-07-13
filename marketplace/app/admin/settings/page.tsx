import { requireAdmin } from "@/lib/auth";
import { getPlatformFeePercent } from "@/lib/ledger";
import { kieAiEnabled } from "@/lib/kieai";
import AdminSettingsForm from "@/components/AdminSettingsForm";
import { PageHeader } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const [fee, kieApiKeySet] = await Promise.all([getPlatformFeePercent(), kieAiEnabled()]);

  return (
    <div>
      <PageHeader title="Pengaturan Platform" />
      <AdminSettingsForm currentFee={fee} kieApiKeySet={kieApiKeySet} />
    </div>
  );
}
