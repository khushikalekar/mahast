"use client";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export function DemoBanner() {
  const lang = useAppStore((s) => s.language);
  return (
    <div className="demo-banner">
      {t("demoWarning", lang)}
    </div>
  );
}
