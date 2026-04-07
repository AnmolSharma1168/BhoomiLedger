"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api.js";

const emptyForm = {
  parcelId: "", borrowerName: "", borrowerWallet: "",
  principal: "", interestRate: "", tenureMonths: "",
};

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [repayAmount, setRepayAmount] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getLoans();
      setLoans(data.loans);
      setTotal(data.total);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (field: string, val: any) => setForm((f: any) => ({ ...f, [field]: val }));

  // Live EMI preview
  const calcEMI = () => {
    const p = Number(form.principal);
    const r = Number(form.interestRate) / 12 / 100;
    const n = Number(form.tenureMonths);
    if (!p || !r || !n) return 0;
    return Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      await api.createLoan({
        ...form,
        principal: Number(form.principal),
        interestRate: Number(form.interestRate),
        tenureMonths: Number(form.tenureMonths),
      });
      setSuccess("Loan created successfully!");
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleRepay = async () => {
    if (!repayAmount || !selected) return;
    try {
      await api.repayLoan(selected.loanId, Number(repayAmount));
      setSuccess("Repayment recorded!");
      setRepayAmount("");
      setSelected(null);
      load();
    } catch (e: any) { setError(e.message); }
  };

  const fmt = (n: number) => n?.toLocaleString("en-IN") || "0";
  const fmtMoney = (n: number) => n >= 10000000 ? `₹${(n / 10000000).toFixed(2)}Cr` : n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : `₹${fmt(n)}`;
  const progress = (loan: any) => loan.totalRepayable > 0 ? Math.min(100, Math.round((loan.amountPaid / loan.totalRepayable) * 100)) : 0;

  const statusColor: any = { active: "#f59e0b", repaid: "#22c55e", defaulted: "#ef4444", foreclosed: "#888" };

  const emi = calcEMI();

  return (
    <div className="dash-content">
      <div className="dash-header">
        <div>
          <h2 className="dash-title">DeFi Loans</h2>
          <p className="dash-sub">{total} loans · Land-collateralised lending</p>
        </div>
        <button className="btn-gold" onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); setSelected(null); }}>
          {showForm ? "✕ CANCEL" : "+ CREATE LOAN"}
        </button>
      </div>

      {success && <div className="alert-success">✅ {success}</div>}
      {error && <div className="alert-error">⚠ {error}</div>}

      {showForm && (
        <div className="form-card">
          <h3 className="form-title">Create Land-Collateralised Loan</h3>
          <form onSubmit={handleSubmit} className="parcel-form">
            <div className="form-section">
              <p className="form-section-label">COLLATERAL & BORROWER</p>
              <div className="form-row">
                <div className="field">
                  <label>Parcel ID (Collateral)</label>
                  <input value={form.parcelId} onChange={e => set("parcelId", e.target.value)} placeholder="e.g. BL-A1B2C3D4" required />
                </div>
                <div className="field">
                  <label>Borrower Name</label>
                  <input value={form.borrowerName} onChange={e => set("borrowerName", e.target.value)} placeholder="Full legal name" required />
                </div>
                <div className="field">
                  <label>Borrower Wallet</label>
                  <input value={form.borrowerWallet} onChange={e => set("borrowerWallet", e.target.value)} placeholder="0x..." required />
                </div>
              </div>
            </div>
            <div className="form-section">
              <p className="form-section-label">LOAN TERMS</p>
              <div className="form-row">
                <div className="field">
                  <label>Principal (₹)</label>
                  <input type="number" value={form.principal} onChange={e => set("principal", e.target.value)} placeholder="e.g. 2000000" required min="0" />
                </div>
                <div className="field">
                  <label>Annual Interest Rate (%)</label>
                  <input type="number" value={form.interestRate} onChange={e => set("interestRate", e.target.value)} placeholder="e.g. 8.5" required min="0" step="0.1" />
                </div>
                <div className="field">
                  <label>Tenure (Months)</label>
                  <input type="number" value={form.tenureMonths} onChange={e => set("tenureMonths", e.target.value)} placeholder="e.g. 120" required min="1" />
                </div>
              </div>
            </div>

            {emi > 0 && (
              <div className="emi-preview">
                <div><span>Monthly EMI</span><strong style={{ color: "#d4af37" }}>{fmtMoney(emi)}</strong></div>
                <div><span>Total Repayable</span><strong>{fmtMoney(emi * Number(form.tenureMonths))}</strong></div>
                <div><span>Total Interest</span><strong style={{ color: "#ef4444" }}>{fmtMoney((emi * Number(form.tenureMonths)) - Number(form.principal))}</strong></div>
              </div>
            )}

            <button type="submit" className="btn-gold" disabled={saving}>
              {saving ? "CREATING LOAN..." : "CREATE LOAN →"}
            </button>
          </form>
        </div>
      )}

      {/* Loan detail / repayment panel */}
      {selected && (
        <div className="form-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
            <h3 className="form-title" style={{ margin: 0 }}>Loan: {selected.loanId}</h3>
            <button className="btn-ghost" onClick={() => setSelected(null)}>✕ CLOSE</button>
          </div>
          <div className="transfer-detail" style={{ marginBottom: "1rem" }}>
            <div><span>Borrower</span><strong>{selected.borrowerName}</strong></div>
            <div><span>Principal</span><strong>{fmtMoney(selected.principal)}</strong></div>
            <div><span>EMI</span><strong>{fmtMoney(selected.emiAmount)}</strong></div>
            <div><span>Rate</span><strong>{selected.interestRate}% p.a.</strong></div>
            <div><span>Tenure</span><strong>{selected.tenureMonths} months</strong></div>
            <div><span>Total Repayable</span><strong>{fmtMoney(selected.totalRepayable)}</strong></div>
            <div><span>Amount Paid</span><strong style={{ color: "#22c55e" }}>{fmtMoney(selected.amountPaid)}</strong></div>
            <div><span>Remaining</span><strong style={{ color: "#ef4444" }}>{fmtMoney(selected.totalRepayable - selected.amountPaid)}</strong></div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "0.7rem", color: "#666", letterSpacing: "0.1em" }}>REPAYMENT PROGRESS</span>
              <span style={{ fontSize: "0.7rem", color: "#d4af37" }}>{progress(selected)}%</span>
            </div>
            <div style={{ background: "#1a1a1a", height: "6px", borderRadius: "3px" }}>
              <div style={{ height: "100%", width: `${progress(selected)}%`, background: "linear-gradient(90deg, #d4af37, #22c55e)", borderRadius: "3px", transition: "width 0.5s" }} />
            </div>
          </div>

          {selected.status === "active" && (
            <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
              <input
                type="number"
                className="search-bar"
                style={{ flex: 1, background: "#111", border: "1px solid #333", color: "#fff", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none" }}
                placeholder="Enter repayment amount (₹)"
                value={repayAmount}
                onChange={e => setRepayAmount(e.target.value)}
              />
              <button className="btn-gold" onClick={handleRepay}>RECORD REPAYMENT →</button>
            </div>
          )}
          {selected.status === "repaid" && (
            <div className="alert-success">✅ Loan fully repaid — parcel collateral released</div>
          )}
        </div>
      )}

      <div className="dash-table-section">
        {loading ? (
          <div className="empty-state"><p>Loading loans...</p></div>
        ) : loans.length === 0 ? (
          <div className="empty-state"><p>No loans yet. Click <strong>+ CREATE LOAN</strong> to create one.</p></div>
        ) : (
          <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Parcel</th>
                <th>Borrower</th>
                <th>Principal</th>
                <th>EMI</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((l: any) => (
                <tr key={l._id}>
                  <td className="mono">{l.loanId}</td>
                  <td className="mono">{l.parcelId}</td>
                  <td>{l.borrowerName}</td>
                  <td>{fmtMoney(l.principal)}</td>
                  <td>{fmtMoney(l.emiAmount)}/mo</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ flex: 1, background: "#1a1a1a", height: "4px", borderRadius: "2px", minWidth: "60px" }}>
                        <div style={{ height: "100%", width: `${progress(l)}%`, background: "#d4af37", borderRadius: "2px" }} />
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "#666" }}>{progress(l)}%</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ background: (statusColor[l.status] || "#888") + "22", color: statusColor[l.status] || "#888", border: `1px solid ${statusColor[l.status] || "#888"}44` }}>
                      {l.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn-ghost" style={{ padding: "0.3rem 0.8rem", fontSize: "0.65rem" }} onClick={() => { setSelected(l); setShowForm(false); }}>
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