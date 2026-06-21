"use client";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { useState, useEffect } from "react";
import { Users, FileText, TrendingUp, RefreshCw } from "lucide-react";

type SeoLead = {
  id: number;
  email: string;
  url: string;
  score: number;
  created_at: string;
};

type ArticleLead = {
  id: number;
  email: string;
  keyword: string;
  business_name: string;
  article_slug: string;
  created_at: string;
};

type Stats = {
  seo_leads_total: number;
  article_requests_total: number;
  seo_leads_today: number;
  article_requests_today: number;
};

const API_BASE = "http://localhost:3003/api/admin";
const ADMIN_KEY = "nuswalab-admin-2026";

export default function AdminLeadsPage() {
  const [tab, setTab] = useState<"seo" | "articles">("seo");
  const [stats, setStats] = useState<Stats | null>(null);
  const [seoLeads, setSeoLeads] = useState<SeoLead[]>([]);
  const [articleLeads, setArticleLeads] = useState<ArticleLead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const headers = { "x-admin-key": ADMIN_KEY };
      const [statsRes, seoRes, artRes] = await Promise.all([
        fetch(`${API_BASE}/stats`, { headers }),
        fetch(`${API_BASE}/leads/seo`, { headers }),
        fetch(`${API_BASE}/leads/articles`, { headers }),
      ]);
      setStats(await statsRes.json());
      setSeoLeads(await seoRes.json());
      setArticleLeads(await artRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  return (
    <>
      <Nav />
      <div className="min-h-screen" style={{ background: "#0a1a0a", color: "#fff" }}>
        <div className="mx-auto max-w-7xl px-4 py-32">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Admin Leads Dashboard</h1>
            <button
              onClick={fetchAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: "rgba(74,124,89,0.12)", border: "1px solid rgba(74,124,89,0.3)", color: "#4a7c59" }}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { label: "SEO Leads Total", value: stats.seo_leads_total, icon: Users },
                { label: "Artikel Diminta", value: stats.article_requests_total, icon: FileText },
                { label: "SEO Leads Hari Ini", value: stats.seo_leads_today, icon: TrendingUp },
                { label: "Artikel Hari Ini", value: stats.article_requests_today, icon: TrendingUp },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl p-6"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <s.icon className="w-5 h-5 mb-3" style={{ color: "#4a7c59" }} />
                  <div className="text-3xl font-bold mb-1">{s.value}</div>
                  <div className="text-sm" style={{ color: "#9ca3af" }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {(["seo", "articles"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: tab === t ? "#4a7c59" : "rgba(255,255,255,0.04)",
                  color: tab === t ? "#fff" : "#9ca3af",
                  border: tab === t ? "none" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {t === "seo" ? `SEO Leads (${seoLeads.length})` : `Artikel (${articleLeads.length})`}
              </button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-20" style={{ color: "#9ca3af" }}>Loading...</div>
          ) : tab === "seo" ? (
            <div className="overflow-x-auto rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    {["ID", "Email", "URL", "Score", "Tanggal"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: "#9ca3af" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {seoLeads.map((row) => (
                    <tr key={row.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td className="px-4 py-3" style={{ color: "#6b7280" }}>{row.id}</td>
                      <td className="px-4 py-3">{row.email}</td>
                      <td className="px-4 py-3 max-w-xs truncate" style={{ color: "#9ca3af" }}>{row.url}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: row.score >= 70 ? "rgba(74,124,89,0.2)" : "rgba(234,179,8,0.2)", color: row.score >= 70 ? "#4a7c59" : "#ca8a04" }}>
                          {row.score}/100
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#6b7280" }}>{new Date(row.created_at).toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    {["ID", "Email", "Keyword", "Bisnis", "Slug", "Tanggal"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: "#9ca3af" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {articleLeads.map((row) => (
                    <tr key={row.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td className="px-4 py-3" style={{ color: "#6b7280" }}>{row.id}</td>
                      <td className="px-4 py-3">{row.email}</td>
                      <td className="px-4 py-3" style={{ color: "#9ca3af" }}>{row.keyword}</td>
                      <td className="px-4 py-3" style={{ color: "#9ca3af" }}>{row.business_name}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#6b7280" }}>{row.article_slug}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#6b7280" }}>{new Date(row.created_at).toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
