"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api.js";

const STEPS = ["Initiate", "Verify Documents", "Payment", "Complete"];
const STATUS_MAP: any = {
  initiated: 1, documents_verified: 2, payment_done: 3, completed: 4, cancelled: 0
};

const emptyForm = {
  parcelId: "", saleAmount: "",
  seller: { name: "", walletAddress: "" },
  buyer: { name: "", walletAddress: "" },
};

export default function TransferPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
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
      const data = await api.getTransfers();
      setTransfers(data.transfers);
      setTotal(data.total);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (field: string, val: any) => setForm((f: any) => ({ ...f, [field]: val }));
  const setSeller = (field: string, val: string) => setForm((f: any) => ({ ...f, seller: { ...f.seller, [field]: val } }));
  const setBuyer = (field: string, val: string) => setForm((f: any) => ({ ...f, buyer: { ...f.buyer, [field]: val } }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      await api.createTransfer({ ...form, saleAmount: Number(form.saleAmount) });
      setSuccess("Transfer initiated successfully!");
      setForm(emptyForm); setShowForm(false); load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const advanceStep = async (transfer: any) => {
    const stepMap: any = {
      initiated: { step: 2, status: "documents_verified" },
      documents_verified: { step: 3, status: "payment_done" },
      payment_done: { step: 4, status: "completed" },
    };
    const next = stepMap[transfer.status];
    if (!next) return;
    try {
      await api.advanceTransfer(transfer.transferId, next);
      setSuccess("Transfer advanced!");
      setSelected(null); load();
    } catch (e: any) { setError(e.message); }
  };

  const fmt = (n: number) => n?.toLocaleString("en-IN") || "0";
  const statusColor: any = {
    initiated: "#f59e0b", documents_verified: "#3b82f6",
    payment_pending: "#a855f7", payment_done: "#06b6d4",
    completed: "#22c55e", cancelled: "#ef4444"
  };

  return (
    <div className="dash-content">
      <div className="dash-header">
        <div>
          <h2 className="dash-title">Land Transfers</h2>
          <p className="dash-sub">{total} transfers · Escrow-based protocol</p>
        </div>
        <button className="btn-gold" onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); setSelected(null); }}>
          {showForm ? "✕ CANCEL" : "+ INITIATE TRANSFER"}
        </button>
      </div>

      {success && <div className="alert-success">✅ {success}</div>}
      {error && <div className="alert-error">⚠ {error}</div>}

      {showForm && (
        <div className="form-card">
          <h3 className="form-title">Initiate Land Transfer</h3>
          <form onSubmit={handleSubmit} className="parcel-form">
            <div className="form-section">
              <p className="form-section-label">PARCEL & AMOUNT</p>
              <div className="form-row">
                <div className="field"><label>Parcel ID</label><input value={form.parcelId} onChange={e => set("parcelId", e.target.value)} placeholder="e.g. BL-A1B2C3D4" required /></div>
                <div className="field"><label>Sale Amount (₹)</label><input type="number" value={form.saleAmount} onChange={e => set("saleAmount", e.target.value)} placeholder="e.g. 5000000" required min="0" /></div>
              </div>
            </div>
            <div className="form-section">
              <p className="form-section-label">SELLER</p>
              <div className="form-row">
                <div className="field"><label>Seller Name</label><input value={form.seller.name} onChange={e => setSeller("name", e.target.value)} placeholder="Full legal name" required /></div>
                <div className="field"><label>Seller Wallet</label><input value={form.seller.walletAddress} onChange={e => setSeller("walletAddress", e.target.value)} placeholder="0x..." required /></div>
              </div>
            </div>
            <div className="form-section">
              <p className="form-section-label">BUYER</p>
              <div className="form-row">
                <div className="field"><label>Buyer Name</label><input value={form.buyer.name} onChange={e => setBuyer("name", e.target.value)} placeholder="Full legal name" required /></div>
                <div className="field"><label>Buyer Wallet</label><input value={form.buyer.walletAddress} onChange={e => setBuyer("walletAddress", e.target.value)} placeholder="0x..." required /></div>
              </div>
            </div>
            <button type="submit" className="btn-gold" disabled={saving}>{saving ? "INITIATING..." : "INITIATE ESCROW →"}</button>
          </form>
        </div>
      )}

      {selected && (
        <div className="form-card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
            <h3 className="form-title" style={{ margin: 0 }}>Transfer: {selected.transferId}</h3>
            <button className="btn-ghost" onClick={() => setSelected(null)}>✕ CLOSE</button>
          </div>
          <div className="escrow-steps">
            {STEPS.map((step, i) => {
              const currentStep = STATUS_MAP[selected.status] || 0;
              const done = i + 1 < currentStep;
              const active = i + 1 === currentStep;
              return (
                <div key={step} className={`escrow-step ${done ? "done" : ""} ${active ? "active" : ""}`}>
                  <div className="step-circle">{done ? "✓" : i + 1}</div>
                  <p className="step-label">{step}</p>
                </div>
              );
            })}
          </div>
          <div className="transfer-detail">
            <div><span>Seller</span><strong>{selected.seller?.name}</strong></div>
            <div><span>Buyer</span><strong>{selected.buyer?.name}</strong></div>
            <div><span>Sale Amount</span><strong>₹{fmt(selected.saleAmount)}</strong></div>
            <div><span>Stamp Duty (5%)</span><strong>₹{fmt(selected.stampDuty)}</strong></div>
            <div><span>Reg. Fee (1%)</span><strong>₹{fmt(selected.registrationFee)}</strong></div>
            <div><span>Total</span><strong>₹{fmt(selected.saleAmount + selected.stampDuty + selected.registrationFee)}</strong></div>
          </div>
          {selected.status !== "completed" && selected.status !== "cancelled" && (
            <button className="btn-gold" style={{ marginTop: "1rem" }} onClick={() => advanceStep(selected)}>ADVANCE TO NEXT STEP →</button>
          )}
          {selected.status === "completed" && (
            <div className="alert-success" style={{ marginTop: "1rem" }}>✅ Transfer completed — ownership updated</div>
          )}
        </div>
      )}

      <div className="dash-table-section">
        {loading ? (
          <div className="empty-state"><p>Loading transfers...</p></div>
        ) : transfers.length === 0 ? (
          <div className="empty-state"><p>No transfers yet. Click <strong>+ INITIATE TRANSFER</strong> to start one.</p></div>
        ) : (
          <table className="table-luxury">
            <thead>
              <tr>
                <th>Transfer ID</th><th>Parcel ID</th><th>Seller</th><th>Buyer</th><th>Amount</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t: any) => (
                <tr key={t._id}>
                  <td className="mono">{t.transferId}</td>
                  <td className="mono">{t.parcelId}</td>
                  <td>{t.seller?.name}</td>
                  <td>{t.buyer?.name}</td>
                  <td>₹{fmt(t.saleAmount)}</td>
                  <td>
                    <span className="badge" style={{ background: (statusColor[t.status] || "#888") + "22", color: statusColor[t.status] || "#888", border: `1px solid ${statusColor[t.status] || "#888"}44` }}>
                      {t.status?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td>
                    <button className="btn-ghost" style={{ padding: "0.3rem 0.8rem", fontSize: "0.65rem" }} onClick={() => { setSelected(t); setShowForm(false); }}>VIEW</button>
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