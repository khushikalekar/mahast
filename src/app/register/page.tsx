"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import axios from "axios";
import { Bus } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const { language, setUser } = useAppStore();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/register", form);
      setUser(res.data.user, res.data.token);
      router.push("/");
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error ?? "Registration failed" : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div style={{ maxWidth: 400, margin: "3rem auto", padding: "0 1rem" }}>
      <div className="card" style={{ padding: "2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <Bus size={28} color="#f97316" />
          </div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--color-text)", margin: "0 0 4px" }}>
            Create Account
          </h1>
          <p style={{ color: "var(--color-muted)", fontSize: "0.875rem", margin: 0 }}>Join MahaST Smart Bus</p>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#dc2626", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {[
            { key: "name" as const, label: t("name", language), type: "text", placeholder: "Your full name", required: true },
            { key: "email" as const, label: t("email", language), type: "email", placeholder: "you@email.com", required: true },
            { key: "password" as const, label: t("password", language), type: "password", placeholder: "Min 6 characters", required: true },
            { key: "phone" as const, label: t("phone", language), type: "tel", placeholder: "+91 9XXXXXXXXX", required: false },
          ].map(({ key, label, type, placeholder, required }) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text)", marginBottom: 6 }}>
                {label} {required && <span style={{ color: "#dc2626" }}>*</span>}
              </label>
              <input type={type} className="input" placeholder={placeholder} value={form[key]} onChange={set(key)} required={required} />
            </div>
          ))}
          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 6 }} disabled={loading}>
            {loading ? "Creating account..." : t("register", language)}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.875rem", color: "var(--color-muted)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
            {t("login", language)}
          </Link>
        </div>
      </div>
    </div>
  );
}
