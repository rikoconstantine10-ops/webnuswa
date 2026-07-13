import { requireAdmin } from "@/lib/auth";
import { getPlatformFeePercent } from "@/lib/ledger";
import { getAiSettingsForAdmin } from "@/lib/kieai";
import AdminSettingsForm from "@/components/AdminSettingsForm";
import { PageHeader } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const [fee, aiSettings] = await Promise.all([getPlatformFeePercent(), getAiSettingsForAdmin()]);

  return (
    <div>
      <PageHeader title="Pengaturan Platform" />
      <AdminSettingsForm currentFee={fee} imageConfig={aiSettings.image} captionConfig={aiSettings.caption} />
    </div>
  );
}
