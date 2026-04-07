"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [parcels, setParcels] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const token = localStorage.getItem("bl_token");
  if (!token) { setLoading(false); return; }

  const timeout = setTimeout(() => setLoading(false), 10000); // 10s max

  Promise.allSettled([
    api.stats(),
    api.getParcels("limit=100"),
    api.getTransfers("limit=100"),
    api.getLoans("limit=100"),
  ]).then(([s, p, t, l]) => {
    if (s.status === "fulfilled") setStats(s.value.stats);
    if (p.status === "fulfilled") setParcels(p.value.parcels || []);
    if (t.status === "fulfilled") setTransfers(t.value.transfers || []);
    if (l.status === "fulfilled") setLoans(l.value.loans || []);
  }).finally(() => {
    clearTimeout(timeout);
    setLoading(false);
  });
}, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--gold)", fontFamily: "var(--font-mono)", fontSize: "12px", letterSpacing: "0.2em" }}>
      LOADING ANALYTICS...
    </div>
  );

  const fmt = (n: number) => n?.toLocaleString("en-IN") || "0";
  const fmtMoney = (n: number) => n >= 10000000 ? `₹${(n/10000000).toFixed(2)}Cr` : n >= 100000 ? `₹${(n/100000).toFixed(2)}L` : `₹${fmt(n)}`;

  const totalLoanValue = loans.reduce((s, l) => s + (l.principal || 0), 0);
  const totalRepaid = loans.reduce((s, l) => s + (l.amountPaid || 0), 0);
  const totalOutstanding = loans.reduce((s, l) => s + Math.max(0, (l.totalRepayable || 0) - (l.amountPaid || 0)), 0);

  const landTypes = parcels.reduce((acc: any, p) => { acc[p.landType] = (acc[p.landType] || 0) + 1; return acc; }, {});
  const landTypeTotal = parcels.length || 1;
  const transferStatuses = transfers.reduce((acc: any, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});
  const districts = parcels.reduce((acc: any, p) => { const d = p.location?.district || "Unknown"; acc[d] = (acc[d] || 0) + 1; return acc; }, {});
  const topDistricts = Object.entries(districts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);
  const monthlyTransfers = transfers.reduce((acc: any, t) => {
    const month = new Date(t.createdAt).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    acc[month] = (acc[month] || 0) + (t.saleAmount || 0);
    return acc;
  }, {});
  const monthlyKeys = Object.keys(monthlyTransfers).slice(-6);
  const maxMonthlyVal = Math.max(...Object.values(monthlyTransfers) as number[], 1);

  const landTypeColors: any = { agricultural: "#22c55e", residential: "#3b82f6", commercial: "#f59e0b", industrial: "#a855f7", forest: "#06b6d4" };
  const statusColors: any = { completed: "#22c55e", initiated: "#f59e0b", documents_verified: "#3b82f6", payment_done: "#06b6d4", cancelled: "#ef4444" };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, pageW, 40, "F");
    doc.setDrawColor(201, 168, 76);
    doc.setLineWidth(0.5);
    doc.line(0, 40, pageW, 40);
    doc.setTextColor(201, 168, 76);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("BHOOMILEDGER", 14, 18);
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("LAND REGISTRY PROTOCOL — ANALYTICS REPORT", 14, 26);
    doc.text(`Generated: ${date}`, 14, 33);

    doc.setTextColor(201, 168, 76);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("KEY PERFORMANCE INDICATORS", 14, 52);
    doc.setDrawColor(201, 168, 76);
    doc.setLineWidth(0.3);
    doc.line(14, 54, pageW - 14, 54);

    const kpis = [
      ["Total Land Value", fmtMoney(parcels.reduce((s, p) => s + (p.marketValue || 0), 0))],
      ["Transfer Volume", fmtMoney(transfers.reduce((s, t) => s + (t.saleAmount || 0), 0))],
      ["Total Parcels", String(parcels.length)],
      ["Total Transfers", String(transfers.length)],
      ["Active Loans", String(loans.filter(l => l.status === "active").length)],
      ["Total Loan Book", fmtMoney(totalLoanValue)],
      ["Amount Repaid", fmtMoney(totalRepaid)],
      ["Outstanding Debt", fmtMoney(totalOutstanding)],
    ];

    kpis.forEach(([label, value], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 14 + col * 95;
      const y = 62 + row * 18;
      doc.setFillColor(20, 20, 20);
      doc.rect(x, y - 5, 88, 14, "F");
      doc.setDrawColor(50, 50, 50);
      doc.setLineWidth(0.2);
      doc.rect(x, y - 5, 88, 14, "S");
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(label.toUpperCase(), x + 4, y + 1);
      doc.setTextColor(201, 168, 76);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(value, x + 4, y + 7);
    });

    let yPos = 140;

    doc.setTextColor(201, 168, 76);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("REGISTERED PARCELS", 14, yPos);
    doc.line(14, yPos + 2, pageW - 14, yPos + 2);

    autoTable(doc, {
      startY: yPos + 6,
      head: [["Parcel ID", "Owner", "Location", "Area", "Type", "Value", "Status"]],
      body: parcels.map(p => [p.parcelId, p.ownerName, `${p.location?.village}, ${p.location?.district}`, `${p.area?.value} ${p.area?.unit}`, p.landType, fmtMoney(p.marketValue), p.status?.replace(/_/g, " ") || "active"]),
      styles: { fontSize: 7, cellPadding: 3, textColor: [200, 200, 200], fillColor: [15, 15, 15], lineColor: [40, 40, 40], lineWidth: 0.1 },
      headStyles: { fillColor: [30, 25, 10], textColor: [201, 168, 76], fontStyle: "bold", fontSize: 7 },
      alternateRowStyles: { fillColor: [20, 20, 20] },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 14;

    if (transfers.length > 0) {
      if (yPos > 220) { doc.addPage(); yPos = 20; }
      doc.setTextColor(201, 168, 76);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("TRANSFER HISTORY", 14, yPos);
      doc.line(14, yPos + 2, pageW - 14, yPos + 2);
      autoTable(doc, {
        startY: yPos + 6,
        head: [["Transfer ID", "Parcel", "Seller", "Buyer", "Amount", "Status"]],
        body: transfers.map(t => [t.transferId, t.parcelId, t.seller?.name, t.buyer?.name, fmtMoney(t.saleAmount), t.status?.replace(/_/g, " ")]),
        styles: { fontSize: 7, cellPadding: 3, textColor: [200, 200, 200], fillColor: [15, 15, 15], lineColor: [40, 40, 40], lineWidth: 0.1 },
        headStyles: { fillColor: [30, 25, 10], textColor: [201, 168, 76], fontStyle: "bold", fontSize: 7 },
        alternateRowStyles: { fillColor: [20, 20, 20] },
        margin: { left: 14, right: 14 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 14;
    }

    if (loans.length > 0) {
      if (yPos > 220) { doc.addPage(); yPos = 20; }
      doc.setTextColor(201, 168, 76);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("LOAN PORTFOLIO", 14, yPos);
      doc.line(14, yPos + 2, pageW - 14, yPos + 2);
      autoTable(doc, {
        startY: yPos + 6,
        head: [["Loan ID", "Parcel", "Borrower", "Principal", "EMI", "Repaid", "Status"]],
        body: loans.map(l => [l.loanId, l.parcelId, l.borrowerName, fmtMoney(l.principal), `${fmtMoney(l.emiAmount)}/mo`, fmtMoney(l.amountPaid), l.status]),
        styles: { fontSize: 7, cellPadding: 3, textColor: [200, 200, 200], fillColor: [15, 15, 15], lineColor: [40, 40, 40], lineWidth: 0.1 },
        headStyles: { fillColor: [30, 25, 10], textColor: [201, 168, 76], fontStyle: "bold", fontSize: 7 },
        alternateRowStyles: { fillColor: [20, 20, 20] },
        margin: { left: 14, right: 14 },
      });
    }

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(201, 168, 76);
      doc.setLineWidth(0.3);
      doc.line(14, 285, pageW - 14, 285);
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("BhoomiLedger — Blockchain Land Registry", 14, 290);
      doc.text(`Page ${i} of ${pageCount}`, pageW - 14, 290, { align: "right" });
    }

    doc.save(`BhoomiLedger-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }} className="animate-fade-up">
        <div>
          <div className="section-heading" style={{ marginBottom: "8px" }}>Analytics</div>
          <h1 style={{ fontFamily: "var(--font-body)", fontWeight: "300", fontSize: "40px", color: "var(--white)" }}>Reports</h1>
          <p style={{ color: "var(--white-mute)", fontSize: "16px", marginTop: "6px" }}>
            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <button className="btn-gold" onClick={exportPDF}>↓ EXPORT PDF</button>
      </div>

      {/* KPI Cards */}
      <div className="stat-grid" style={{ marginBottom: "32px" }}>
        {[
          { label: "Total Land Value", value: fmtMoney(parcels.reduce((s, p) => s + (p.marketValue || 0), 0)), sub: `${parcels.length} parcels`, color: "gold" },
          { label: "Transfer Volume", value: fmtMoney(transfers.reduce((s, t) => s + (t.saleAmount || 0), 0)), sub: `${transfers.length} transactions`, color: "green" },
          { label: "Loan Book", value: fmtMoney(totalLoanValue), sub: `${loans.length} loans`, color: "blue" },
          { label: "Outstanding Debt", value: fmtMoney(totalOutstanding), sub: `${fmtMoney(totalRepaid)} repaid`, color: "purple" },
        ].map(card => (
          <div key={card.label} className={`stat-card stat-${card.color}`}>
            <p className="stat-label">{card.label}</p>
            <p className="stat-value">{card.value}</p>
            <p className="stat-sub">{card.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        {/* Land Type Breakdown */}
        <div className="card" style={{ padding: "28px" }}>
          <div className="section-heading" style={{ marginBottom: "20px" }}>Land Type Distribution</div>
          {Object.keys(landTypes).length === 0 ? (
            <p style={{ color: "var(--white-mute)", fontSize: "14px" }}>No parcels registered yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {Object.entries(landTypes).map(([type, count]: any) => (
                <div key={type}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "14px", textTransform: "capitalize", color: "var(--white-dim)" }}>{type}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: landTypeColors[type] || "#888" }}>{count} ({Math.round((count / landTypeTotal) * 100)}%)</span>
                  </div>
                  <div style={{ background: "var(--black-5)", height: "4px", borderRadius: "2px" }}>
                    <div style={{ height: "100%", width: `${(count / landTypeTotal) * 100}%`, background: landTypeColors[type] || "#888", borderRadius: "2px", transition: "width 0.8s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transfer Status Breakdown */}
        <div className="card" style={{ padding: "28px" }}>
          <div className="section-heading" style={{ marginBottom: "20px" }}>Transfer Status Breakdown</div>
          {Object.keys(transferStatuses).length === 0 ? (
            <p style={{ color: "var(--white-mute)", fontSize: "14px" }}>No transfers yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {Object.entries(transferStatuses).map(([status, count]: any) => (
                <div key={status}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "14px", textTransform: "capitalize", color: "var(--white-dim)" }}>{status.replace(/_/g, " ")}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: statusColors[status] || "#888" }}>{count}</span>
                  </div>
                  <div style={{ background: "var(--black-5)", height: "4px", borderRadius: "2px" }}>
                    <div style={{ height: "100%", width: `${(count / (transfers.length || 1)) * 100}%`, background: statusColors[status] || "#888", borderRadius: "2px" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Transfer Volume */}
        <div className="card" style={{ padding: "28px" }}>
          <div className="section-heading" style={{ marginBottom: "20px" }}>Monthly Transfer Volume</div>
          {monthlyKeys.length === 0 ? (
            <p style={{ color: "var(--white-mute)", fontSize: "14px" }}>No transfer data yet.</p>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px", paddingTop: "1rem" }}>
              {monthlyKeys.map(month => {
                const val = monthlyTransfers[month];
                const heightPct = Math.max(4, (val / maxMonthlyVal) * 100);
                return (
                  <div key={month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "9px", color: "var(--gold)", fontFamily: "var(--font-mono)" }}>{fmtMoney(val)}</span>
                    <div style={{ width: "100%", height: `${heightPct}%`, background: "linear-gradient(180deg, #c9a84c, #7a6130)", borderRadius: "2px 2px 0 0", transition: "height 0.5s" }} />
                    <span style={{ fontSize: "9px", color: "var(--white-mute)", fontFamily: "var(--font-mono)" }}>{month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Districts */}
        <div className="card" style={{ padding: "28px" }}>
          <div className="section-heading" style={{ marginBottom: "20px" }}>Top Districts by Parcels</div>
          {topDistricts.length === 0 ? (
            <p style={{ color: "var(--white-mute)", fontSize: "14px" }}>No data yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {topDistricts.map(([district, count]: any, i) => (
                <div key={district} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--gold)", width: "20px" }}>#{i + 1}</span>
                  <span style={{ flex: 1, fontSize: "14px", color: "var(--white-dim)" }}>{district}</span>
                  <div style={{ width: "80px", background: "var(--black-5)", height: "4px", borderRadius: "2px" }}>
                    <div style={{ height: "100%", width: `${(count / (topDistricts[0][1] as number)) * 100}%`, background: "var(--gold)", borderRadius: "2px" }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--white-mute)", width: "20px", textAlign: "right" }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loan Health */}
      <div className="card" style={{ padding: "28px" }}>
        <div className="section-heading" style={{ marginBottom: "20px" }}>Loan Portfolio Health</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" }}>
          {[
            { label: "Total Disbursed", value: fmtMoney(totalLoanValue), color: "var(--gold)" },
            { label: "Total Repaid", value: fmtMoney(totalRepaid), color: "#2ecc71" },
            { label: "Outstanding", value: fmtMoney(totalOutstanding), color: "#e74c3c" },
            { label: "Recovery Rate", value: totalLoanValue > 0 ? `${Math.round((totalRepaid / totalLoanValue) * 100)}%` : "0%", color: "#3b82f6" },
          ].map(item => (
            <div key={item.label} style={{ background: "var(--black-4)", border: "1px solid rgba(201,168,76,0.08)", padding: "16px" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.15em", color: "var(--white-mute)", marginBottom: "8px", textTransform: "uppercase" }}>{item.label}</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "18px", color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>
        {totalLoanValue > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--white-mute)", letterSpacing: "0.1em" }}>OVERALL REPAYMENT PROGRESS</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--gold)" }}>{Math.round((totalRepaid / totalLoanValue) * 100)}%</span>
            </div>
            <div style={{ background: "var(--black-5)", height: "6px", borderRadius: "3px" }}>
              <div style={{ height: "100%", width: `${Math.min(100, (totalRepaid / totalLoanValue) * 100)}%`, background: "linear-gradient(90deg, var(--gold), #2ecc71)", borderRadius: "3px", transition: "width 0.8s ease" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}