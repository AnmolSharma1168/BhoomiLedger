"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api.js";
import "../../../app/globals.css";

interface DocumentRequest {
  _id: string;
  parcelId: string;
  ownerName: string;
  ownerEmail: string;
  documentName: string;
  documentType: string;
  documentUrl: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export default function AdminDocumentsPage() {
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadData();
  }, [filter, page, search]);

  async function loadData() {
    setLoading(true);
    try {
      const [reqsRes, statsRes] = await Promise.all([
        api.get(
          filter === "pending"
            ? `/documents/admin/pending?page=${page}&limit=20&search=${search}`
            : `/documents/admin/all?page=${page}&limit=20&search=${search}`
        ),
        api.get("/documents/admin/stats"),
      ]);

      setRequests(reqsRes.requests || []);
      setStats(statsRes.stats || null);
    } catch (err: any) {
      console.error("Failed to load data:", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    setActionLoading(id);
    try {
      await api.post(`/documents/admin/approve/${id}`, {});
      setRequests(requests.filter((r) => r._id !== id));
      await loadData();
    } catch (err: any) {
      alert("Error approving document: " + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    setActionLoading(id);
    try {
      await api.post(`/documents/admin/reject/${id}`, { rejectionReason });
      setRequests(requests.filter((r) => r._id !== id));
      setRejectingId(null);
      setRejectionReason("");
      await loadData();
    } catch (err: any) {
      alert("Error rejecting document: " + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      title_deed: "Title Deed",
      survey_report: "Survey Report",
      tax_receipt: "Tax Receipt",
      ownership_proof: "Ownership Proof",
      other: "Other Document",
    };
    return labels[type] || type;
  };

  return (
    <main style={{ padding: "0" }}>
      <div style={styles.container}>
        <div style={{ marginBottom: "40px" }}>
          <div className="section-heading" style={{ marginBottom: "8px" }}>Document Management</div>
          <h1 style={{ fontFamily: "var(--font-body)", fontWeight: "300", fontSize: "40px", color: "var(--white)" }}>Document Approvals</h1>
          <p style={{ color: "var(--white-mute)", fontSize: "16px", marginTop: "6px" }}>Review and approve property documents from citizens</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="stat-grid" style={{ marginBottom: "32px" }}>
            <div className="stat-card stat-gold">
              <p className="stat-label">Pending Requests</p>
              <p className="stat-value">{stats.pending}</p>
              <p className="stat-sub">Awaiting review</p>
            </div>
            <div className="stat-card stat-green">
              <p className="stat-label">Approved</p>
              <p className="stat-value">{stats.approved}</p>
              <p className="stat-sub">Documents verified</p>
            </div>
            <div className="stat-card stat-purple">
              <p className="stat-label">Rejected</p>
              <p className="stat-value">{stats.rejected}</p>
              <p className="stat-sub">Sent back for revision</p>
            </div>
            <div className="stat-card stat-blue">
              <p className="stat-label">Total Documents</p>
              <p className="stat-value">{stats.total}</p>
              <p className="stat-sub">All submissions</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={styles.controls}>
          <div style={styles.filterGroup}>
            <button
              style={{
                ...styles.filterBtn,
                ...(filter === "pending" ? styles.filterBtnActive : {}),
              }}
              onClick={() => {
                setFilter("pending");
                setPage(1);
              }}
            >
              Pending Only
            </button>
            <button
              style={{
                ...styles.filterBtn,
                ...(filter === "all" ? styles.filterBtnActive : {}),
              }}
              onClick={() => {
                setFilter("all");
                setPage(1);
              }}
            >
              All Requests
            </button>
          </div>

          <input
            type="text"
            style={styles.searchInput}
            placeholder="Search by property ID, owner name, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Requests List */}
        {loading ? (
          <div style={styles.loading}>Loading document requests...</div>
        ) : requests.length === 0 ? (
          <div style={styles.emptyState}>
            {filter === "pending" ? "No pending document requests" : "No document requests found"}
          </div>
        ) : (
          <div style={styles.requestsList}>
            {requests.map((req) => (
              <div key={req._id} style={styles.requestCard}>
                <div style={styles.requestContent}>
                  {/* Left: Document Info */}
                  <div style={styles.docInfo}>
                    <h3 style={styles.docName}>{req.documentName}</h3>
                    <div style={styles.docMeta}>
                      <span style={styles.metaItem}>
                        🏠 <strong>{req.parcelId}</strong>
                      </span>
                      <span style={styles.metaItem}>
                        📄 {getDocumentTypeLabel(req.documentType)}
                      </span>
                      <span style={styles.metaItem}>
                        📅 {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={styles.ownerInfo}>
                      <p style={styles.ownerName}>Owner: {req.ownerName}</p>
                      <p style={styles.ownerEmail}>Email: {req.ownerEmail}</p>
                    </div>

                    {/* Document Link */}
                    <div style={styles.docActions}>
                      <a
                        href={`http://localhost:3001/${req.documentUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.previewLink}
                      >
                        👁️ Preview Document
                      </a>
                      <a
                        href={`http://localhost:3001/api/documents/download/${req._id}`}
                        style={styles.downloadLink}
                      >
                        ⬇️ Download
                      </a>
                    </div>
                  </div>

                  {/* Right: Actions/Status */}
                  <div style={styles.requestActions}>
                    {req.status === "pending" ? (
                      <>
                        <button
                          style={styles.approveBtn}
                          onClick={() => handleApprove(req._id)}
                          disabled={actionLoading === req._id}
                        >
                          {actionLoading === req._id ? "Processing..." : "✓ Approve"}
                        </button>

                        {rejectingId === req._id ? (
                          <div style={styles.rejectForm}>
                            <textarea
                              style={styles.rejectReason}
                              placeholder="Reason for rejection..."
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                            />
                            <div style={styles.rejectButtons}>
                              <button
                                style={styles.rejectSubmitBtn}
                                onClick={() => handleReject(req._id)}
                                disabled={actionLoading === req._id}
                              >
                                {actionLoading === req._id ? "Processing..." : "Reject"}
                              </button>
                              <button
                                style={styles.cancelBtn}
                                onClick={() => {
                                  setRejectingId(null);
                                  setRejectionReason("");
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            style={styles.rejectBtn}
                            onClick={() => setRejectingId(req._id)}
                          >
                            ✗ Reject
                          </button>
                        )}
                      </>
                    ) : (
                      <div style={styles.statusDisplay}>
                        <div
                          style={{
                            ...styles.statusBadge,
                            backgroundColor:
                              req.status === "approved"
                                ? "#7cb342"
                                : req.status === "rejected"
                                  ? "#e74c3c"
                                  : "#f39c12",
                          }}
                        >
                          {req.status === "approved"
                            ? "✓ Approved"
                            : "✗ Rejected"}
                        </div>
                        {req.status === "rejected" && req.rejectionReason && (
                          <p style={styles.rejectionNote}>
                            Reason: {req.rejectionReason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  controls: {
    display: "flex",
    gap: "15px",
    marginBottom: "30px",
    flexWrap: "wrap" as const,
    alignItems: "center",
  },
  filterGroup: {
    display: "flex",
    gap: "10px",
  },
filterBtn: {
  padding: "10px 16px",
  background: "var(--black-5)",
  border: "1px solid var(--border-subtle)",
  color: "var(--white-mute)",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.9rem",
  fontWeight: 600,
  transition: "all 0.3s ease",
},

filterBtnActive: {
  background: "#d4af37",
  border: "1px solid #d4af37",   // ✅ FIXED
  color: "#000",
},
  searchInput: {
    flex: 1,
    minWidth: "250px",
    padding: "10px 14px",
    background: "var(--black-5)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "6px",
    color: "var(--white)",
    fontSize: "0.9rem",
  },
  requestsList: {
    display: "grid",
    gap: "16px",
  },
  requestCard: {
    background: "var(--black-8)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "10px",
    padding: "20px",
    backdropFilter: "blur(10px)",
  },
  requestContent: {
    display: "grid",
    gridTemplateColumns: "1fr 200px",
    gap: "20px",
    alignItems: "flex-start",
  },
  docInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  docName: {
    fontSize: "1.1rem",
    color: "#d4af37",
    margin: 0,
    fontWeight: 700,
  },
  docMeta: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap" as const,
    paddingBottom: "10px",
    borderBottom: "1px solid var(--border-subtle)",
  },
  metaItem: {
    color: "var(--white-mute)",
    fontSize: "0.85rem",
    fontWeight: 500,
  },
  ownerInfo: {
    background: "var(--black-5)",
    padding: "12px",
    borderRadius: "6px",
    borderLeft: "2px solid #d4af37",
  },
  ownerName: {
    color: "var(--white)",
    fontSize: "0.9rem",
    margin: "0 0 4px 0",
    fontWeight: 600,
  },
  ownerEmail: {
    color: "var(--white-mute)",
    fontSize: "0.85rem",
    margin: 0,
    fontWeight: 400,
  },
  docActions: {
    display: "flex",
    gap: "10px",
  },
  previewLink: {
    padding: "8px 12px",
    background: "var(--black-5)",
    border: "1px solid #7cb342",
    borderRadius: "6px",
    color: "#95d82d",
    textDecoration: "none",
    fontSize: "0.85rem",
    textAlign: "center" as const,
    cursor: "pointer",
    fontWeight: 600,
    transition: "all 0.3s ease",
  },
  downloadLink: {
    padding: "8px 12px",
    background: "var(--black-5)",
    border: "1px solid #3498db",
    borderRadius: "6px",
    color: "#5dade2",
    textDecoration: "none",
    fontSize: "0.85rem",
    textAlign: "center" as const,
    cursor: "pointer",
    fontWeight: 600,
    transition: "all 0.3s ease",
  },
  requestActions: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
    justifyContent: "flex-start",
  },
  approveBtn: {
    padding: "10px 15px",
    background: "#7cb342",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.9rem",
    transition: "all 0.3s ease",
  },
  rejectBtn: {
    padding: "10px 15px",
    background: "#e74c3c",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.9rem",
    transition: "all 0.3s ease",
  },
  rejectForm: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
    background: "var(--black-5)",
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #e74c3c",
  },
  rejectReason: {
    padding: "10px",
    background: "var(--black-8)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "4px",
    color: "var(--white)",
    fontSize: "0.85rem",
    fontFamily: "monospace",
    minHeight: "60px",
    resize: "vertical" as const,
  },
  rejectButtons: {
    display: "flex",
    gap: "10px",
  },
  rejectSubmitBtn: {
    flex: 1,
    padding: "8px 12px",
    background: "#e74c3c",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.85rem",
  },
  cancelBtn: {
    flex: 1,
    padding: "8px 12px",
    background: "var(--black-8)",
    border: "1px solid var(--border-subtle)",
    color: "var(--white)",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: "0.85rem",
  },
  statusDisplay: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
  },
  statusBadge: {
    padding: "8px 12px",
    borderRadius: "6px",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.8rem",
    textAlign: "center" as const,
  },
  rejectionNote: {
    color: "#ff6b6b",
    fontSize: "0.8rem",
    margin: 0,
    fontStyle: "italic",
    background: "var(--black-5)",
    padding: "8px",
    borderRadius: "4px",
    borderLeft: "2px solid #e74c3c",
  },
  emptyState: {
    textAlign: "center" as const,
    color: "var(--white-mute)",
    padding: "60px 20px",
    fontSize: "1rem",
  },
  loading: {
    textAlign: "center" as const,
    color: "var(--white-mute)",
    padding: "40px 20px",
  },
};
