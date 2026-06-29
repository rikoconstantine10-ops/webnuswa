'use client';
import { useState } from "react";
import { useLocale } from "next-intl";
import { Lock, BarChart2, FileText, MessageSquare, ExternalLink } from "lucide-react";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";

const WA_NUMBER = "6285181301622";

const FEATURES = [
  {
    icon: BarChart2,
    titleId: "Dashboard Performa",
    titleEn: "Performance Dashboard",
    descId: "Pantau ROAS, traffic, lead, dan konversi real-time.",
    descEn: "Monitor ROAS, traffic, leads, and conversions in real-time.",
  },
  {
    icon: FileText,
    titleId: "Laporan Bulanan",
    titleEn: "Monthly Reports",
    descId: "Laporan PDF otomatis dengan insight dan rekomendasi.",
    descEn: "Automated PDF reports with insights and recommendations.",
  },
  {
    icon: MessageSquare,
    titleId: "Chat Langsung",
    titleEn: "Direct Chat",
    descId: "Hubungi account manager tanpa antri via portal.",
    descEn: "Reach your account manager without queuing via the portal.",
  },
];

export default function ClientPortalPage() {
  const locale = useLocale();
  const isEn = locale === "en";
  const [mode, setMode] = useState<"login" | "request">("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [requestForm, setRequestForm] = useState({ name: "", email: "", company: "", wa: "" });
  const [requestSent, setRequestSent] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const waMsg = encodeURIComponent(
    isEn
      ? "Hi! I'd like to request access to the Nuswalab Client Portal."
      : "Halo! Saya ingin request akses Client Portal Nuswalab."
  );

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");
    await new Promise((r) => setTimeout(r, 800));
    setLoginError(isEn ? "Invalid credentials. Contact your account manager." : "Email atau password salah. Hubungi account manager Anda.");
    setLoading(false);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setRequestSent(true);
    setLoading(false);
  };

  return (
    <main className="min-h-screen section-padding" style={{ background: "oklch(0.98 0.003 265)" }}>
      <div className="container-custom max-w-5xl mx-auto">

        {/* Header */}
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5" style={{ background: "#4a7c5920", color: "#4a7c59" }}>
              <Lock className="w-3.5 h-3.5" />
              {isEn ? "Client Portal" : "Portal Klien"}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>
              {isEn ? "Your Marketing Hub" : "Pusat Marketing Anda"}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {isEn
                ? "Track campaigns, access reports, and chat with your team — all in one place."
                : "Pantau kampanye, akses laporan, dan chat dengan tim — semua di satu tempat."}
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid md:grid-cols-5 gap-8">

          {/* Feature list */}
          <div className="md:col-span-2 space-y-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <AnimateOnScroll key={f.titleId} delay={i * 80}>
                  <div className="shimmer-card rounded-2xl p-5 flex gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#4a7c5918" }}>
                      <Icon className="w-5 h-5" style={{ color: "#4a7c59" }} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm mb-0.5">{isEn ? f.titleEn : f.titleId}</div>
                      <div className="text-xs text-muted-foreground">{isEn ? f.descEn : f.descId}</div>
                    </div>
                  </div>
                </AnimateOnScroll>
              );
            })}
            <AnimateOnScroll delay={280}>
              <div className="shimmer-card rounded-2xl p-5">
                <p className="text-xs text-muted-foreground mb-3">
                  {isEn ? "Not a client yet? Book a free strategy call." : "Belum jadi klien? Booking strategy call gratis."}
                </p>
                <a
                  href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(isEn ? "Hi Nuswalab! I want to learn more about your services." : "Halo Nuswalab! Saya ingin tahu lebih lanjut tentang layanan Anda.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4a7c59] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {isEn ? "Chat on WhatsApp" : "Chat WhatsApp"}
                </a>
              </div>
            </AnimateOnScroll>
          </div>

          {/* Auth Card */}
          <AnimateOnScroll className="md:col-span-3" delay={100}>
            <div className="shimmer-card rounded-2xl p-5 sm:p-8">
              {/* Tabs */}
              <div className="flex rounded-xl overflow-hidden border border-border mb-7">
                {(["login", "request"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setMode(tab); setLoginError(""); }}
                    className="flex-1 py-2.5 text-sm font-semibold transition-colors"
                    style={
                      mode === tab
                        ? { background: "#4a7c59", color: "white" }
                        : { background: "transparent", color: "var(--muted-foreground)" }
                    }
                  >
                    {tab === "login"
                      ? (isEn ? "Login" : "Masuk")
                      : (isEn ? "Request Access" : "Minta Akses")}
                  </button>
                ))}
              </div>

              {mode === "login" ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                      {isEn ? "Password" : "Kata Sandi"}
                    </label>
                    <input
                      type="password"
                      required
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                    />
                  </div>
                  {loginError && (
                    <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{loginError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60"
                    style={{ background: "#4a7c59" }}
                  >
                    {loading ? "..." : (isEn ? "Sign In" : "Masuk")}
                  </button>
                  <p className="text-xs text-center text-muted-foreground">
                    {isEn ? "Forgot your password? " : "Lupa password? "}
                    <a
                      href={`https://wa.me/${WA_NUMBER}?text=${waMsg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#4a7c59] hover:underline"
                    >
                      {isEn ? "Contact us" : "Hubungi kami"}
                    </a>
                  </p>
                </form>
              ) : requestSent ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-4">✅</div>
                  <h3 className="font-bold mb-2">{isEn ? "Request Received!" : "Permintaan Diterima!"}</h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    {isEn
                      ? "Our team will review your request and contact you within 1 business day."
                      : "Tim kami akan mereview permintaan Anda dan menghubungi dalam 1 hari kerja."}
                  </p>
                  <a
                    href={`https://wa.me/${WA_NUMBER}?text=${waMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: "#25d366" }}
                  >
                    {isEn ? "Chat on WhatsApp" : "Chat WhatsApp"}
                  </a>
                </div>
              ) : (
                <form onSubmit={handleRequestSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                        {isEn ? "Full Name" : "Nama Lengkap"}
                      </label>
                      <input
                        type="text"
                        required
                        value={requestForm.name}
                        onChange={e => setRequestForm(p => ({ ...p, name: e.target.value }))}
                        placeholder={isEn ? "Your name" : "Nama Anda"}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                        {isEn ? "Company" : "Perusahaan"}
                      </label>
                      <input
                        type="text"
                        required
                        value={requestForm.company}
                        onChange={e => setRequestForm(p => ({ ...p, company: e.target.value }))}
                        placeholder={isEn ? "Company name" : "Nama bisnis"}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Email</label>
                    <input
                      type="email"
                      required
                      value={requestForm.email}
                      onChange={e => setRequestForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                      {isEn ? "WhatsApp Number" : "Nomor WhatsApp"}
                    </label>
                    <input
                      type="tel"
                      required
                      value={requestForm.wa}
                      onChange={e => setRequestForm(p => ({ ...p, wa: e.target.value }))}
                      placeholder="08xxxxxxxxxx"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60"
                    style={{ background: "#4a7c59" }}
                  >
                    {loading ? "..." : (isEn ? "Request Access" : "Minta Akses")}
                  </button>
                </form>
              )}
            </div>
          </AnimateOnScroll>
        </div>
      </div>
    </main>
  );
}
