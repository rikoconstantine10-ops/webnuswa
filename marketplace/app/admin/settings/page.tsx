import { requireAdmin } from "@/lib/auth";
import { getPlatformFeePercent } from "@/lib/ledger";
import { getAiSettingsForAdmin } from "@/lib/kieai";
import { db } from "@/lib/db";
import AdminSettingsForm from "@/components/AdminSettingsForm";
import { PageHeader } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const [fee, aiSettings, globalPromptSetting] = await Promise.all([
    getPlatformFeePercent(),
    getAiSettingsForAdmin(),
    db.setting.findUnique({ where: { key: "wa_global_system_prompt" } }),
  ]);

  return (
    <div>
      <PageHeader title="Pengaturan Platform" />
      <AdminSettingsForm
        currentFee={fee}
        captionConfig={aiSettings.caption}
        voiceConfig={aiSettings.voice}
        imageTiers={aiSettings.imageTiers}
        videoTiers={aiSettings.videoTiers}
        chatTiers={aiSettings.chatTiers}
        globalSystemPrompt={globalPromptSetting?.value ?? ""}
      />
    </div>
  );
}
