"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api.js";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    api.stats()
      .then(data => { setStats(data.stats); setRecent(data.recentTransfers || []); })
      .catch(() => setStats({ parcels: { total: 0, active: 0, underTransfer: 0, mortgaged: 0 }, transfers: { total: 0, completed: 0 }, loans: { active: 0, totalValue: 0 }, wills: { active: 0, executed: 0 } }))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => n?.toLocaleString("en-IN") || "0";
  const fmtMoney = (n: number) => n >= 10000000 ? `₹${(n/10000000).toFixed(1)}Cr` : n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : `₹${fmt(n)}`;

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--gold)", fontFamily: "var(--font-mono)", fontSize: "12px", letterSpacing: "0.2em" }}>LOADING LIVE DATA...</div>;

  const cards = [
    { label: "Total Parcels", value: fmt(stats?.parcels.total || 0), sub: `${stats?.parcels.active || 0} active`, color: "gold" },
    { label: "Transfers", value: fmt(stats?.transfers.total || 0), sub: `${stats?.transfers.completed || 0} completed`, color: "green" },
    { label: "Active Loans", value: fmt(stats?.loans.active || 0), sub: fmtMoney(stats?.loans.totalValue || 0), color: "blue" },
    { label: "Wills Registered", value: fmt(stats?.wills.active || 0), sub: `${stats?.wills.executed || 0} executed`, color: "purple" },
  ];

  return (
    <div>
      <div style={{ marginBottom: "40px" }} className="animate-fade-up">
        <div className="section-heading" style={{ marginBottom: "8px" }}>System Overview</div>
        <h1 style={{ fontFamily: "var(--font-body)", fontWeight: "300", fontSize: "40px", color: "var(--white)" }}>Dashboard</h1>
        <p style={{ color: "var(--white-mute)", fontSize: "16px", marginTop: "6px" }}>Live registry data · Polygon Amoy Testnet</p>
      </div>

      <div className="stat-grid">
        {cards.map(card => (
          <div key={card.label} className={`stat-card stat-${card.color}`}>
            <p className="stat-label">{card.label}</p>
            <p className="stat-value">{card.value}</p>
            <p className="stat-sub">{card.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "32px" }}>
        <div className="section-heading" style={{ marginBottom: "16px" }}>Recent Transfers</div>
        <div className="card">
          {recent.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--white-mute)", fontFamily: "var(--font-body)", fontSize: "16px" }}>
              No transfers yet. Register a parcel and initiate a transfer to see activity here.
            </div>
          ) : (
            <table className="table-luxury">
              <thead>
                <tr><th>Transfer ID</th><th>Parcel ID</th><th>Seller</th><th>Buyer</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recent.map((t: any) => (
                  <tr key={t._id}>
                    <td className="mono" style={{ color: "var(--gold-light)" }}>{t.transferId}</td>
                    <td className="mono">{t.parcelId}</td>
                    <td>{t.seller?.name || "—"}</td>
                    <td>{t.buyer?.name || "—"}</td>
                    <td>₹{fmt(t.saleAmount)}</td>
                    <td><span className="badge badge-active">{t.status?.replace(/_/g, " ")}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div style={{ marginTop: "32px" }}>
        <div className="section-heading" style={{ marginBottom: "16px" }}>Parcel Status Breakdown</div>
        <div className="card" style={{ padding: "28px" }}>
          {[
            { label: "Active", value: stats?.parcels.active || 0, total: stats?.parcels.total || 1, color: "#2ecc71" },
            { label: "Under Transfer", value: stats?.parcels.underTransfer || 0, total: stats?.parcels.total || 1, color: "#c9a84c" },
            { label: "Mortgaged", value: stats?.parcels.mortgaged || 0, total: stats?.parcels.total || 1, color: "#9b59b6" },
          ].map(bar => (
            <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--white-mute)", width: "110px", letterSpacing: "0.08em" }}>{bar.label.toUpperCase()}</span>
              <div style={{ flex: 1, background: "var(--black-5)", height: "4px", borderRadius: "2px" }}>
                <div style={{ height: "100%", width: `${bar.total > 0 ? (bar.value / bar.total) * 100 : 0}%`, background: bar.color, borderRadius: "2px", transition: "width 0.8s ease" }} />
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--white-mute)", width: "24px", textAlign: "right" }}>{bar.value}</span>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
}