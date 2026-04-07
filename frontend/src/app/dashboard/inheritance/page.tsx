"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api.js";

const emptyForm = {
  testatorName: "", testatorWallet: "", parcelIds: "",
  executionCondition: "on_death", executionDate: "", notes: "",
  beneficiaries: [{ name: "", walletAddress: "", relation: "", sharePercent: "" }],
};

export default function InheritancePage() {
  const [wills, setWills] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getWills();
      setWills(data.wills);
      setTotal(data.total);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (field: string, val: any) => setForm((f: any) => ({ ...f, [field]: val }));

  const setBeneficiary = (i: number, field: string, val: string) => {
    setForm((f: any) => {
      const b = [...f.beneficiaries];
      b[i] = { ...b[i], [field]: val };
      return { ...f, beneficiaries: b };
    });
  };

  const addBeneficiary = () => setForm((f: any) => ({
    ...f, beneficiaries: [...f.beneficiaries, { name: "", walletAddress: "", relation: "", sharePercent: "" }]
  }));

  const removeBeneficiary = (i: number) => setForm((f: any) => ({
    ...f, beneficiaries: f.beneficiaries.filter((_: any, idx: number) => idx !== i)
  }));

  const totalShare = form.beneficiaries.reduce((sum: number, b: any) => sum + (Number(b.sharePercent) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Math.round(totalShare) !== 100) { setError("Beneficiary shares must total exactly 100%"); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      await api.createWill({
        ...form,
        parcelIds: form.parcelIds.split(",").map((s: string) => s.trim()).filter(Boolean),
        beneficiaries: form.beneficiaries.map((b: any) => ({ ...b, sharePercent: Number(b.sharePercent) })),
      });
      setSuccess("Will registered successfully!");
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleExecute = async (will: any) => {
    try {
      await api.executeWill(will.willId);
      setSuccess("Will executed successfully!");
      setSelected(null);
      load();
    } catch (e: any) { setError(e.message); }
  };

  const handleRevoke = async (will: any) => {
    try {
      await api.revokeWill(will.willId);
      setSuccess("Will revoked.");
      setSelected(null);
      load();
    } catch (e: any) { setError(e.message); }
  };

  const statusColor: any = { active: "#f59e0b", executed: "#22c55e", revoked: "#888", disputed: "#ef4444" };

  return (
    <div className="dash-content">
      <div className="dash-header">
        <div>
          <h2 className="dash-title">Inheritance & Wills</h2>
          <p className="dash-sub">{total} wills registered · Smart contract execution</p>
        </div>
        <button className="btn-gold" onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); setSelected(null); }}>
          {showForm ? "✕ CANCEL" : "+ REGISTER WILL"}
        </button>
      </div>

      {success && <div className="alert-success">✅ {success}</div>}
      {error && <div className="alert-error">⚠ {error}</div>}

      {showForm && (
        <div className="form-card">
          <h3 className="form-title">Register New Will</h3>
          <form onSubmit={handleSubmit} className="parcel-form">
            <div className="form-section">
              <p className="form-section-label">TESTATOR (WILL MAKER)</p>
              <div className="form-row">
                <div className="field">
                  <label>Full Name</label>
                  <input value={form.testatorName} onChange={e => set("testatorName", e.target.value)} placeholder="Legal name" required />
                </div>
                <div className="field">
                  <label>Wallet Address</label>
                  <input value={form.testatorWallet} onChange={e => set("testatorWallet", e.target.value)} placeholder="0x..." required />
                </div>
              </div>
            </div>

            <div className="form-section">
              <p className="form-section-label">PARCELS & EXECUTION</p>
              <div className="form-row">
                <div className="field">
                  <label>Parcel IDs (comma separated)</label>
                  <input value={form.parcelIds} onChange={e => set("parcelIds", e.target.value)} placeholder="BL-XXXXXX, BL-YYYYYY" required />
                </div>
                <div className="field">
                  <label>Execution Condition</label>
                  <select value={form.executionCondition} onChange={e => set("executionCondition", e.target.value)}>
                    <option value="on_death">On Death</option>
                    <option value="on_date">On Specific Date</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                {form.executionCondition === "on_date" && (
                  <div className="field">
                    <label>Execution Date</label>
                    <input type="date" value={form.executionDate} onChange={e => set("executionDate", e.target.value)} required />
                  </div>
                )}
              </div>
              <div className="form-row" style={{ marginTop: "0.8rem" }}>
                <div className="field">
                  <label>Notes</label>
                  <input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Optional notes" />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                <p className="form-section-label" style={{ margin: 0 }}>BENEFICIARIES</p>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ fontSize: "0.7rem", color: totalShare === 100 ? "#22c55e" : "#ef4444" }}>
                    Total: {totalShare}% {totalShare === 100 ? "✓" : "(must be 100%)"}
                  </span>
                  <button type="button" className="btn-ghost" style={{ padding: "0.3rem 0.8rem", fontSize: "0.65rem" }} onClick={addBeneficiary}>
                    + ADD
                  </button>
                </div>
              </div>
              {form.beneficiaries.map((b: any, i: number) => (
                <div key={i} className="form-row" style={{ marginBottom: "0.6rem", background: "#0a0a0a", padding: "0.8rem", border: "1px solid #1a1a1a" }}>
                  <div className="field">
                    <label>Name</label>
                    <input value={b.name} onChange={e => setBeneficiary(i, "name", e.target.value)} placeholder="Full name" required />
                  </div>
                  <div className="field">
                    <label>Wallet</label>
                    <input value={b.walletAddress} onChange={e => setBeneficiary(i, "walletAddress", e.target.value)} placeholder="0x..." required />
                  </div>
                  <div className="field">
                    <label>Relation</label>
                    <input value={b.relation} onChange={e => setBeneficiary(i, "relation", e.target.value)} placeholder="e.g. Son" />
                  </div>
                  <div className="field">
                    <label>Share %</label>
                    <input type="number" value={b.sharePercent} onChange={e => setBeneficiary(i, "sharePercent", e.target.value)} placeholder="e.g. 50" min="0" max="100" required />
                  </div>
                  {form.beneficiaries.length > 1 && (
                    <div className="field" style={{ display: "flex", alignItems: "flex-end" }}>
                      <button type="button" className="btn-ghost" style={{ padding: "0.4rem 0.8rem", fontSize: "0.65rem", color: "#ef4444", borderColor: "#ef444444" }} onClick={() => removeBeneficiary(i)}>
                        REMOVE
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button type="submit" className="btn-gold" disabled={saving || totalShare !== 100}>
              {saving ? "REGISTERING..." : "REGISTER WILL ON BLOCKCHAIN →"}
            </button>
          </form>
        </div>
      )}

      {/* Will detail panel */}
      {selected && (
        <div className="form-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
            <h3 className="form-title" style={{ margin: 0 }}>Will: {selected.willId}</h3>
            <button className="btn-ghost" onClick={() => setSelected(null)}>✕ CLOSE</button>
          </div>
          <div className="transfer-detail" style={{ marginBottom: "1rem" }}>
            <div><span>Testator</span><strong>{selected.testatorName}</strong></div>
            <div><span>Parcels</span><strong>{selected.parcelIds?.join(", ")}</strong></div>
            <div><span>Condition</span><strong style={{ textTransform: "capitalize" }}>{selected.executionCondition?.replace("_", " ")}</strong></div>
            <div><span>Status</span><strong style={{ color: statusColor[selected.status] }}>{selected.status}</strong></div>
            <div><span>Registered</span><strong>{new Date(selected.createdAt).toLocaleDateString("en-IN")}</strong></div>
            {selected.notes && <div><span>Notes</span><strong>{selected.notes}</strong></div>}
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <p className="form-section-label">BENEFICIARIES</p>
            <table className="data-table" style={{ marginTop: "0.5rem" }}>
              <thead><tr><th>Name</th><th>Relation</th><th>Wallet</th><th>Share</th></tr></thead>
              <tbody>
                {selected.beneficiaries?.map((b: any, i: number) => (
                  <tr key={i}>
                    <td>{b.name}</td>
                    <td>{b.relation || "—"}</td>
                    <td className="mono">{b.walletAddress?.slice(0, 10)}...</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ flex: 1, background: "#1a1a1a", height: "4px", borderRadius: "2px", minWidth: "60px" }}>
                          <div style={{ height: "100%", width: `${b.sharePercent}%`, background: "#d4af37", borderRadius: "2px" }} />
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#d4af37" }}>{b.sharePercent}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected.status === "active" && (
            <div style={{ display: "flex", gap: "0.8rem" }}>
              <button className="btn-gold" onClick={() => handleExecute(selected)}>EXECUTE WILL →</button>
              <button className="btn-ghost" style={{ color: "#ef4444", borderColor: "#ef444444" }} onClick={() => handleRevoke(selected)}>REVOKE</button>
            </div>
          )}
          {selected.status === "executed" && <div className="alert-success">✅ Will executed — assets distributed to beneficiaries</div>}
          {selected.status === "revoked" && <div className="alert-error">Will has been revoked</div>}
        </div>
      )}

      <div className="dash-table-section">
        {loading ? (
          <div className="empty-state"><p>Loading wills...</p></div>
        ) : wills.length === 0 ? (
          <div className="empty-state"><p>No wills registered. Click <strong>+ REGISTER WILL</strong> to add one.</p></div>
        ) : (
          <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Will ID</th>
                <th>Testator</th>
                <th>Parcels</th>
                <th>Beneficiaries</th>
                <th>Condition</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {wills.map((w: any) => (
                <tr key={w._id}>
                  <td className="mono">{w.willId}</td>
                  <td>{w.testatorName}</td>
                  <td className="mono">{w.parcelIds?.join(", ")}</td>
                  <td>{w.beneficiaries?.length} beneficiar{w.beneficiaries?.length === 1 ? "y" : "ies"}</td>
                  <td style={{ textTransform: "capitalize" }}>{w.executionCondition?.replace("_", " ")}</td>
                  <td>
                    <span className="badge" style={{ background: (statusColor[w.status] || "#888") + "22", color: statusColor[w.status] || "#888", border: `1px solid ${statusColor[w.status] || "#888"}44` }}>
                      {w.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn-ghost" style={{ padding: "0.3rem 0.8rem", fontSize: "0.65rem" }} onClick={() => { setSelected(w); setShowForm(false); }}>
                      VIEW
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}