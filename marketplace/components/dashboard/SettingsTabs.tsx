"use client";

import { ReactNode, useEffect, useState } from "react";

export default function SettingsTabs({
  tabs,
  panels,
}: {
  tabs: Array<{ key: string; label: string }>;
  panels: Record<string, ReactNode>;
}) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");

  // Dukung deep-link ?tab=xxx (mis. dari checklist onboarding "Sambungkan WhatsApp").
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("tab");
    if (fromUrl && tabs.some((t) => t.key === fromUrl)) setActive(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition ${
              active === t.key
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>{panels[active]}</div>
    </div>
  );
}
