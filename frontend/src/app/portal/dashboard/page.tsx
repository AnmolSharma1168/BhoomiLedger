"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api.js";

export default function PortalDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [parcels, setParcels] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"parcels" | "transfers" | "loans">("parcels");
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("bl_token");
    const u = localStorage.getItem("bl_user");
    if (!token) { router.replace("/portal/login"); return; }
    if (u) setUser(JSON.parse(u));

    Promise.allSettled([
      api.getParcels(),
      api.getTransfers(),
      api.getLoans(),
    ]).then(([p, t, l]) => {
      if (p.status === "fulfilled") setParcels(p.value.parcels || []);
      if (t.status === "fulfilled") setTransfers(t.value.transfers || []);
      if (l.status === "fulfilled") setLoans(l.value.loans || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(""); setSearchResult(null);
    try {
      const data = await api.getParcel(search.trim());
      setSearchResult(data.parcel);
    } catch (e: any) { setSearchError("Parcel not found. Check the ID and try again."); }
  };

  const logout = () => {
    localStorage.removeItem("bl_token");
    localStorage.removeItem("bl_user");
    router.replace("/portal/login");
  };

  const fmt = (n: number) => n?.toLocaleString("en-IN") || "0";
  const fmtMoney = (n: number) => n >= 10000000 ? `₹${(n/10000000).toFixed(2)}Cr` : n >= 100000 ? `₹${(n/100000).toFixed(2)}L` : `₹${fmt(n)}`;
  const statusColor: any = { active: "#22c55e", under_transfer: "#f59e0b", mortgaged: "#a855f7", disputed: "#e74c3c", completed: "#22c55e", initiated: "#f59e0b", repaid: "#22c55e" };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#f5f0e8" }}>
      {/* Nav */}
      <nav style={{ background: "#0f0f0f", borderBottom: "1px solid rgba(201,168,76,0.15)", padding: "0 2rem", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg, #c9a84c, #e8c96d)", clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "0.8rem", fontWeight: 600, color: "#000" }}>B</span>
          </div>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem", letterSpacing: "0.15em", color: "#d4af37" }}>BHOOMI<span style={{ color: "#f5f0e8" }}>LEDGER</span></span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "#666", letterSpacing: "0.1em", marginLeft: "0.5rem" }}>CITIZEN PORTAL</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#888" }}>
            {user?.name} · <span style={{ color: "#d4af37" }}>{user?.role?.toUpperCase()}</span>
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={logout} className="btn-ghost" style={{ padding: "0.3rem 0.8rem", fontSize: "0.65rem" }}>LOGOUT</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        {/* Verify search */}
        <div style={{ background: "#0f0f0f", border: "1px solid rgba(201,168,76,0.2)", padding: "1.5rem", marginBottom: "2rem" }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "0.7rem", letterSpacing: "0.2em", color: "#d4af37", marginBottom: "0.8rem" }}>VERIFY LAND RECORD</p>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.8rem" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Enter Parcel ID (e.g. BL-A1B2C3D4)"
              style={{ flex: 1, background: "#111", border: "1px solid #333", color: "#fff", padding: "0.6rem 1rem", fontSize: "0.9rem", outline: "none", fontFamily: "var(--font-mono)" }} required />
            <button type="submit" className="btn-gold">VERIFY →</button>
          </form>
          {searchError && <p style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "0.6rem", fontFamily: "var(--font-mono)" }}>⚠ {searchError}</p>}
          {searchResult && (
            <div style={{ marginTop: "1rem", background: "#0a0a0a", border: "1px solid rgba(46,204,113,0.2)", padding: "1rem" }}>
              <p style={{ color: "#22c55e", fontSize: "0.7rem", letterSpacing: "0.15em", fontFamily: "var(--font-mono)", marginBottom: "0.8rem" }}>✅ VERIFIED — RECORD FOUND</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.8rem" }}>
                {[
                  ["Parcel ID", searchResult.parcelId],
                  ["Owner", searchResult.ownerName],
                  ["Location", `${searchResult.location?.village}, ${searchResult.location?.district}`],
                  ["Area", `${searchResult.area?.value} ${searchResult.area?.unit}`],
                  ["Land Type", searchResult.landType],
                  ["Market Value", fmtMoney(searchResult.marketValue)],
                  ["Status", searchResult.status?.replace(/_/g, " ")],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p style={{ fontSize: "0.6rem", color: "#666", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</p>
                    <p style={{ fontSize: "0.9rem", color: "#fff", marginTop: "0.2rem", textTransform: "capitalize" }}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a", marginBottom: "1.5rem" }}>
          {(["parcels", "transfers", "loans"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", borderBottom: tab === t ? "2px solid #d4af37" : "2px solid transparent", color: tab === t ? "#d4af37" : "#666", fontFamily: "var(--font-display)", fontSize: "0.7rem", letterSpacing: "0.15em", padding: "0.8rem 1.5rem", cursor: "pointer", textTransform: "uppercase", transition: "all 0.2s" }}>
              {t} ({t === "parcels" ? parcels.length : t === "transfers" ? transfers.length : loans.length})
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#d4af37", fontFamily: "var(--font-mono)", fontSize: "12px", letterSpacing: "0.2em" }}>LOADING RECORDS...</div>
        ) : (
          <>
            {tab === "parcels" && (
              parcels.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "#666", fontFamily: "var(--font-body)" }}>No parcels found in the registry yet.</div>
              ) : (
                <table className="table-luxury">
                  <thead><tr><th>Parcel ID</th><th>Owner</th><th>Location</th><th>Area</th><th>Land Type</th><th>Market Value</th><th>Status</th></tr></thead>
                  <tbody>
                    {parcels.map((p: any) => (
                      <tr key={p._id}>
                        <td><span className="mono" style={{ color: "#c9a84c" }}>{p.parcelId}</span></td>
                        <td>{p.ownerName}</td>
                        <td>{p.location?.village}, {p.location?.district}</td>
                        <td><span className="mono">{p.area?.value} {p.area?.unit}</span></td>
                        <td style={{ textTransform: "capitalize" }}>{p.landType}</td>
                        <td>{fmtMoney(p.marketValue)}</td>
                        <td><span className="badge" style={{ background: (statusColor[p.status] || "#888") + "22", color: statusColor[p.status] || "#888", border: `1px solid ${statusColor[p.status] || "#888"}44` }}>{p.status?.replace(/_/g, " ")}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {tab === "transfers" && (
              transfers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "#666", fontFamily: "var(--font-body)" }}>No transfers recorded yet.</div>
              ) : (
                <table className="table-luxury">
                  <thead><tr><th>Transfer ID</th><th>Parcel</th><th>Seller</th><th>Buyer</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {transfers.map((t: any) => (
                      <tr key={t._id}>
                        <td><span className="mono" style={{ color: "#c9a84c" }}>{t.transferId}</span></td>
                        <td><span className="mono">{t.parcelId}</span></td>
                        <td>{t.seller?.name}</td>
                        <td>{t.buyer?.name}</td>
                        <td>{fmtMoney(t.saleAmount)}</td>
                        <td><span className="badge" style={{ background: (statusColor[t.status] || "#888") + "22", color: statusColor[t.status] || "#888", border: `1px solid ${statusColor[t.status] || "#888"}44` }}>{t.status?.replace(/_/g, " ")}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {tab === "loans" && (
              loans.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "#666", fontFamily: "var(--font-body)" }}>No loans recorded yet.</div>
              ) : (
                <table className="table-luxury">
                  <thead><tr><th>Loan ID</th><th>Parcel</th><th>Borrower</th><th>Principal</th><th>EMI</th><th>Status</th></tr></thead>
                  <tbody>
                    {loans.map((l: any) => (
                      <tr key={l._id}>
                        <td><span className="mono" style={{ color: "#c9a84c" }}>{l.loanId}</span></td>
                        <td><span className="mono">{l.parcelId}</span></td>
                        <td>{l.borrowerName}</td>
                        <td>{fmtMoney(l.principal)}</td>
                        <td>{fmtMoney(l.emiAmount)}/mo</td>
                        <td><span className="badge" style={{ background: (statusColor[l.status] || "#888") + "22", color: statusColor[l.status] || "#888", border: `1px solid ${statusColor[l.status] || "#888"}44` }}>{l.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}