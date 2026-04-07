"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api.js";

const LAND_TYPES = ["agricultural", "residential", "commercial", "industrial", "forest"];
const UNITS = ["acres", "hectares", "sq_ft", "sq_m"];

const empty = {
  ownerName: "", ownerEmail: "", ownerAddress: "", landType: "agricultural",
  location: { district: "", village: "", surveyNumber: "", taluk: "", state: "" },
  area: { value: "", unit: "acres" },
  marketValue: "",
};

export default function RegistryPage() {
  const [parcels, setParcels] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  const load = async (q = "") => {
    setLoading(true);
    try {
      const data = await api.getParcels(q ? `search=${q}` : "");
      setParcels(data.parcels || []);
      setTotal(data.total || 0);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(search); };

  const set = (field: string, val: any) => setForm((f: any) => ({ ...f, [field]: val }));
  const setLoc = (field: string, val: string) => setForm((f: any) => ({ ...f, location: { ...f.location, [field]: val } }));
  const setArea = (field: string, val: any) => setForm((f: any) => ({ ...f, area: { ...f.area, [field]: val } }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      await api.createParcel({
        ...form,
        area: { ...form.area, value: Number(form.area.value) },
        marketValue: Number(form.marketValue),
      });
      setSuccess("Parcel registered successfully on-chain!");
      setForm(empty); setShowForm(false); load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };



  const fmt = (n: number) => n?.toLocaleString("en-IN") || "0";
  const statusColor: Record<string, string> = {
    active: "#2ecc71", under_transfer: "#c9a84c", mortgaged: "#9b59b6", disputed: "#e74c3c"
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }} className="animate-fade-up">
        <div>
          <div className="section-heading" style={{ marginBottom: "8px" }}>On-Chain Records</div>
          <h1 style={{ fontFamily: "var(--font-body)", fontWeight: "300", fontSize: "40px", color: "var(--white)" }}>Land Registry</h1>
          <p style={{ color: "var(--white-mute)", fontSize: "16px", marginTop: "6px" }}>{total} parcels registered · MongoDB + Polygon Amoy</p>
        </div>
        <button className="btn-gold" onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); }}>
          {showForm ? "✕ Cancel" : "+ Register Parcel"}
        </button>
      </div>

      {/* Alerts */}
      {success && (
        <div style={{ background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.3)", color: "#2ecc71", padding: "12px 16px", marginBottom: "24px", fontFamily: "var(--font-mono)", fontSize: "13px", borderRadius: "2px" }}>
          ✓ {success}
        </div>
      )}
      {error && (
        <div style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", color: "#e74c3c", padding: "12px 16px", marginBottom: "24px", fontFamily: "var(--font-mono)", fontSize: "13px", borderRadius: "2px" }}>
          ⚠ {error}
        </div>
      )}

      {/* Registration form */}
      {showForm && (
        <div className="card animate-fade-up" style={{ padding: "36px", marginBottom: "32px" }}>
          <div className="section-heading" style={{ marginBottom: "24px" }}>New Parcel Registration</div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.2em", color: "var(--gold-dim)", marginBottom: "12px" }}>OWNER DETAILS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div>
                  <label className="label-luxury">Owner Name</label>
                  <input className="input-luxury" placeholder="Full legal name" value={form.ownerName} onChange={e => set("ownerName", e.target.value)} required />
                </div>
                <div>
                  <label className="label-luxury">Email Address</label>
                  <input className="input-luxury" type="email" placeholder="owner@example.com" value={form.ownerEmail} onChange={e => set("ownerEmail", e.target.value)} required />
                </div>
                <div>
                  <label className="label-luxury">Wallet Address</label>
                  <input className="input-luxury" placeholder="0x..." value={form.ownerAddress} onChange={e => set("ownerAddress", e.target.value)} required />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.2em", color: "var(--gold-dim)", marginBottom: "12px" }}>LOCATION</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div><label className="label-luxury">District</label><input className="input-luxury" placeholder="e.g. Bengaluru Urban" value={form.location.district} onChange={e => setLoc("district", e.target.value)} required /></div>
                <div><label className="label-luxury">Village / Area</label><input className="input-luxury" placeholder="e.g. Whitefield" value={form.location.village} onChange={e => setLoc("village", e.target.value)} required /></div>
                <div><label className="label-luxury">Survey Number</label><input className="input-luxury" placeholder="e.g. 45/2A" value={form.location.surveyNumber} onChange={e => setLoc("surveyNumber", e.target.value)} required /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div><label className="label-luxury">Taluk</label><input className="input-luxury" placeholder="e.g. Anekal" value={form.location.taluk} onChange={e => setLoc("taluk", e.target.value)} /></div>
                <div><label className="label-luxury">State</label><input className="input-luxury" placeholder="e.g. Karnataka" value={form.location.state} onChange={e => setLoc("state", e.target.value)} /></div>
              </div>
            </div>

            <div style={{ marginBottom: "28px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.2em", color: "var(--gold-dim)", marginBottom: "12px" }}>LAND DETAILS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px" }}>
                <div>
                  <label className="label-luxury">Land Type</label>
                  <select className="input-luxury" value={form.landType} onChange={e => set("landType", e.target.value)} style={{ cursor: "pointer" }}>
                    {LAND_TYPES.map(t => <option key={t} value={t} style={{ background: "var(--black-4)" }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div><label className="label-luxury">Area</label><input className="input-luxury" type="number" placeholder="e.g. 2.5" min="0" step="0.01" value={form.area.value} onChange={e => setArea("value", e.target.value)} required /></div>
                <div>
                  <label className="label-luxury">Unit</label>
                  <select className="input-luxury" value={form.area.unit} onChange={e => setArea("unit", e.target.value)} style={{ cursor: "pointer" }}>
                    {UNITS.map(u => <option key={u} value={u} style={{ background: "var(--black-4)" }}>{u}</option>)}
                  </select>
                </div>
                <div><label className="label-luxury">Market Value (₹)</label><input className="input-luxury" type="number" placeholder="e.g. 5000000" min="0" value={form.marketValue} onChange={e => set("marketValue", e.target.value)} required /></div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button className="btn-gold" type="submit" disabled={saving}>{saving ? "Registering..." : "Register on Blockchain →"}</button>
              <button className="btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}



      {/* Search */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px", flex: 1 }}>
          <input className="input-luxury" placeholder="Search by parcel ID, owner, district..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: "420px" }} />
          <button className="btn-ghost" type="submit">Search</button>
          {search && <button className="btn-ghost" type="button" onClick={() => { setSearch(""); load(); }}>Clear</button>}
        </form>
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ padding: "16px 28px", borderBottom: "1px solid rgba(201,168,76,0.08)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--white-mute)" }}>{loading ? "Loading..." : `${total} PARCELS FOUND`}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--gold)" }}>LIVE · POLYGON AMOY</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--white-mute)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>Loading parcels...</div>
        ) : parcels.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "13px", letterSpacing: "0.2em", color: "var(--white-mute)", marginBottom: "12px" }}>NO PARCELS YET</div>
            <p style={{ color: "var(--white-mute)", fontSize: "16px" }}>Click <strong style={{ color: "var(--gold)" }}>+ Register Parcel</strong> to add the first one.</p>
          </div>
        ) : (
          <table className="table-luxury">
            <thead>
              <tr>
                <th>Parcel ID</th>
                <th>Owner</th>
                <th>Location</th>
                <th>Area</th>
                <th>Type</th>
                <th>Value</th>
                <th>Status</th>
                <th>TX Hash</th>
              </tr>
            </thead>
            <tbody>
              {parcels.map((p: any) => (
                <tr key={p._id}>
                  <td><span className="mono" style={{ color: "var(--gold-light)", fontSize: "13px" }}>{p.parcelId}</span></td>
                  <td style={{ fontSize: "15px" }}>{p.ownerName}</td>
                  <td style={{ fontSize: "14px" }}>{p.location?.village}, {p.location?.district}</td>
                  <td><span className="mono">{p.area?.value} {p.area?.unit}</span></td>
                  <td style={{ fontSize: "14px", textTransform: "capitalize" }}>{p.landType}</td>
                  <td style={{ fontSize: "15px" }}>₹{fmt(p.marketValue)}</td>
                  <td>
                    <span className="badge" style={{ background: (statusColor[p.status] || "#888") + "22", color: statusColor[p.status] || "#888", border: `1px solid ${(statusColor[p.status] || "#888")}44` }}>
                      {p.status?.replace("_", " ") || "active"}
                    </span>
                  </td>
                  <td>
  {p.txHash ? (
    <a
      href={`https://amoy.polygonscan.com/tx/${p.txHash}`}
      target="_blank"
      rel="noreferrer"
      style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--gold)", textDecoration: "none", letterSpacing: "0.05em" }}
      title={p.txHash}
    >
      {p.txHash.slice(0, 8)}...{p.txHash.slice(-6)}
    </a>
  ) : (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--white-mute)" }}>—</span>
  )}
</td>

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}