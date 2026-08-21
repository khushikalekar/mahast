"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { Shield, Phone, AlertTriangle, Zap, MessageCircle, Bug, Users, ArrowRight } from "lucide-react";

export default function EmergencyPage() {
  const { language, addNotification } = useAppStore();
  const [activated, setActivated] = useState<string | null>(null);

  const trigger = (action: string) => {
    setActivated(action);
    addNotification({
      id: Date.now().toString(),
      type: "emergency",
      title: `[DEMO] ${action} Triggered`,
      message: "This is a demo action. In production, this would contact emergency services.",
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    setTimeout(() => setActivated(null), 3000);
  };

  const actions = [
    { key: "SOS", icon: <Zap size={24} color="white" />, label: t("sosButton", language), bg: "#dc2626", desc: "Immediate emergency alert" },
    { key: "accident", icon: <AlertTriangle size={24} color="white" />, label: t("reportAccident", language), bg: "#ea580c", desc: "Report a road accident" },
    { key: "breakdown", icon: <Bug size={24} color="white" />, label: t("reportBreakdown", language), bg: "#d97706", desc: "Report bus breakdown" },
    { key: "safety", icon: <Shield size={24} color="white" />, label: "Report Safety Issue", bg: "#7c3aed", desc: "Unsafe driving, misconduct" },
    { key: "harassment", icon: <Users size={24} color="white" />, label: "Report Harassment", bg: "#db2777", desc: "Harassment on bus" },
    { key: "authority", icon: <Phone size={24} color="white" />, label: t("contactAuthority", language), bg: "#0891b2", desc: "Contact MSRTC control room" },
  ];

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "1rem" }}>
      <div style={{ background: "#fef2f2", border: "2px solid #fecaca", borderRadius: 12, padding: "1rem", marginBottom: "1.25rem", textAlign: "center" }}>
        <Shield size={32} color="#dc2626" style={{ margin: "0 auto 8px" }} />
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#dc2626", margin: "0 0 4px" }}>
          {t("emergency", language)}
        </h1>
        <p style={{ color: "#991b1b", fontSize: "0.875rem", margin: 0 }}>
          ⚠️ This is a prototype. All actions below are demo — they do NOT contact real emergency services.
        </p>
      </div>

      {activated && (
        <div style={{ background: "#fef2f2", border: "2px solid #dc2626", borderRadius: 10, padding: "14px 18px", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#dc2626", animation: "pulse 1s infinite" }} />
          <div>
            <div style={{ fontWeight: 700, color: "#dc2626" }}>[DEMO] {activated} activated</div>
            <div style={{ fontSize: "0.8125rem", color: "#991b1b" }}>In production, this would alert emergency services.</div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: "1.25rem" }}>
        {actions.map(({ key, icon, label, bg, desc }) => (
          <button
            key={key}
            onClick={() => trigger(label)}
            style={{ padding: "1rem", borderRadius: 12, border: "none", background: bg, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, textAlign: "left", transition: "transform 0.1s, opacity 0.1s", opacity: activated === label ? 0.7 : 1 }}
          >
            {icon}
            <div>
              <div style={{ color: "white", fontWeight: 700, fontSize: "0.9375rem" }}>{label}</div>
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.75rem", marginTop: 2 }}>{desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Emergency Contacts */}
      <div className="card">
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>Emergency Numbers</h2>
        {[
          { label: "Police", number: "100", color: "#1e40af" },
          { label: "Ambulance", number: "108", color: "#dc2626" },
          { label: "MSRTC Control Room", number: "1800-22-8843", color: "#16a34a" },
          { label: "Women Helpline", number: "1091", color: "#db2777" },
          { label: "National Emergency", number: "112", color: "#ea580c" },
        ].map(({ label, number, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--color-text)", fontWeight: 500 }}>{label}</span>
            <a href={`tel:${number}`} style={{ fontWeight: 800, fontSize: "1.0625rem", color, textDecoration: "none" }}>{number}</a>
          </div>
        ))}
      </div>
    </div>
  );
}
