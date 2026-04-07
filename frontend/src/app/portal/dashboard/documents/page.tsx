"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api.js";
import "../../../../app/globals.css";

interface DocumentRequest {
  _id: string;
  parcelId: string;
  documentName: string;
  documentType: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
}

interface Parcel {
  _id: string;
  parcelId: string;
  ownerName: string;
  location: {
    village: string;
    district: string;
  };
}

export default function DocumentsPage() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "requests">("upload");

  // Upload form states
  const [selectedParcel, setSelectedParcel] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("other");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  // Load parcels and requests
  useEffect(() => {
    loadParcels();
    loadRequests();
  }, []);

  async function loadParcels() {
    try {
      const response = await api.getParcels("limit=100");
      setParcels(response.parcels || []);
    } catch (err: any) {
      console.error("Failed to load parcels:", err.message);
    }
  }

  async function loadRequests() {
    try {
      const response = await api.get("/documents/my-requests");
      setRequests(response.requests || []);
    } catch (err: any) {
      console.error("Failed to load requests:", err.message);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploadError("");
    setUploadSuccess("");

    if (!selectedParcel || !documentName || !documentFile) {
      setUploadError("Please fill all fields and select a file");
      return;
    }

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("parcelId", selectedParcel);
      formData.append("documentName", documentName);
      formData.append("documentType", documentType);
      formData.append("document", documentFile);

      const response = await fetch("http://localhost:3001/api/documents/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("bl_token")}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setUploadSuccess("Document uploaded successfully! Awaiting admin approval.");
      setSelectedParcel("");
      setDocumentName("");
      setDocumentType("other");
      setDocumentFile(null);

      // Reload requests
      await loadRequests();
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploadLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#d4af37";
      case "pending":
        return "#f39c12";
      case "rejected":
        return "#e74c3c";
      default:
        return "#95a5a6";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <main style={styles.root}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>📄 Property Documents</h1>
          <p style={styles.subtitle}>Upload and manage your property documents with approval tracking</p>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === "upload" ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab("upload")}
          >
            📤 Upload Document
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === "requests" ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab("requests")}
          >
            📋 My Requests ({requests.length})
          </button>
        </div>

        {/* Upload Tab */}
        {activeTab === "upload" && (
          <div style={styles.form}>
            <form onSubmit={handleUpload}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Select Property</label>
                <select
                  style={styles.select}
                  value={selectedParcel}
                  onChange={(e) => setSelectedParcel(e.target.value)}
                  required
                >
                  <option value="">-- Choose Property --</option>
                  {parcels.map((p) => (
                    <option key={p._id} value={p.parcelId}>
                      {p.parcelId} - {p.location.village}, {p.location.district}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Document Type</label>
                <select
                  style={styles.select}
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                >
                  <option value="title_deed">Title Deed</option>
                  <option value="survey_report">Survey Report</option>
                  <option value="tax_receipt">Tax Receipt</option>
                  <option value="ownership_proof">Ownership Proof</option>
                  <option value="other">Other Document</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Document Name</label>
                <input
                  type="text"
                  style={styles.input}
                  placeholder="e.g., Deed 2024"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Upload File (PDF, JPG, PNG)</label>
                <input
                  type="file"
                  style={styles.fileInput}
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                  required
                />
                {documentFile && (
                  <p style={styles.fileName}>
                    ✓ {documentFile.name} ({(documentFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {uploadError && <div style={styles.error}>{uploadError}</div>}
              {uploadSuccess && <div style={styles.success}>{uploadSuccess}</div>}

              <button
                type="submit"
                style={{
                  ...styles.button,
                  opacity: uploadLoading ? 0.7 : 1,
                }}
                disabled={uploadLoading}
              >
                {uploadLoading ? "Uploading..." : "📤 Upload Document"}
              </button>
            </form>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <div style={styles.requestsList}>
            {requests.length === 0 ? (
              <p style={styles.emptyState}>No documents uploaded yet. Start by uploading a document!</p>
            ) : (
              requests.map((req) => (
                <div key={req._id} style={styles.requestCard}>
                  <div style={styles.requestHeader}>
                    <div>
                      <h3 style={styles.requestTitle}>{req.documentName}</h3>
                      <p style={styles.requestMeta}>Property: {req.parcelId}</p>
                    </div>
                    <div
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: getStatusColor(req.status),
                      }}
                    >
                      {getStatusLabel(req.status)}
                    </div>
                  </div>

                  <div style={styles.requestDetails}>
                    <div style={styles.detail}>
                      <span style={styles.detailLabel}>Type:</span>
                      <span style={styles.detailValue}>{req.documentType.replace(/_/g, " ")}</span>
                    </div>
                    <div style={styles.detail}>
                      <span style={styles.detailLabel}>Submitted:</span>
                      <span style={styles.detailValue}>
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {req.status === "approved" && req.approvedAt && (
                      <div style={styles.detail}>
                        <span style={styles.detailLabel}>✓ Approved:</span>
                        <span style={styles.detailValue}>
                          {new Date(req.approvedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {req.status === "rejected" && req.rejectionReason && (
                      <div style={styles.detail}>
                        <span style={styles.detailLabel}>✗ Reason:</span>
                        <span style={styles.detailValue}>{req.rejectionReason}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
          color: #e0e0e0;
          margin: 0;
          padding: 0;
        }
      `}</style>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)",
    padding: "40px 20px",
  },
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },
  header: {
    textAlign: "center" as const,
    marginBottom: "50px",
  },
  title: {
    fontSize: "3rem",
    color: "#d4af37",
    margin: "0 0 15px 0",
    textShadow: "0 0 30px rgba(212, 175, 55, 0.3)",
    fontWeight: 700,
  },
  subtitle: {
    color: "#a0a0a0",
    fontSize: "1rem",
    margin: 0,
    fontWeight: 300,
  },
  tabs: {
    display: "flex",
    gap: "5px",
    marginBottom: "35px",
    background: "rgba(255, 255, 255, 0.03)",
    padding: "8px",
    borderRadius: "12px",
    border: "1px solid rgba(212, 175, 55, 0.1)",
    backdropFilter: "blur(10px)",
  },
  tab: {
    padding: "14px 24px",
    background: "transparent",
    border: "none",
    color: "#999",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: 600,
    borderRadius: "8px",
    transition: "all 0.3s ease",
    flex: 1,
    textAlign: "center" as const,
  },
  tabActive: {
    color: "#000",
    background: "linear-gradient(135deg, #d4af37 0%, #f0c040 100%)",
    boxShadow: "0 4px 15px rgba(212, 175, 55, 0.3)",
  },
  form: {
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)",
    border: "1px solid rgba(212, 175, 55, 0.25)",
    borderRadius: "16px",
    padding: "40px",
    backdropFilter: "blur(15px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
  },
  formGroup: {
    marginBottom: "28px",
  },
  label: {
    display: "block",
    color: "#d4af37",
    fontSize: "0.9rem",
    fontWeight: 700,
    marginBottom: "12px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "2px solid rgba(212, 175, 55, 0.2)",
    borderRadius: "8px",
    color: "#e0e0e0",
    fontSize: "0.95rem",
    fontWeight: 500,
    transition: "all 0.3s ease",
    boxSizing: "border-box" as const,
  },
  select: {
    width: "100%",
    padding: "14px 16px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "2px solid rgba(212, 175, 55, 0.2)",
    borderRadius: "8px",
    color: "#e0e0e0",
    fontSize: "0.95rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxSizing: "border-box" as const,
  },
  fileInput: {
    width: "100%",
    padding: "20px 16px",
    background: "rgba(212, 175, 55, 0.08)",
    border: "2px dashed rgba(212, 175, 55, 0.4)",
    borderRadius: "10px",
    color: "#e0e0e0",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: 500,
    transition: "all 0.3s ease",
    boxSizing: "border-box" as const,
  },
  fileName: {
    color: "#7cb342",
    fontSize: "0.9rem",
    marginTop: "12px",
    padding: "10px 12px",
    background: "rgba(124, 179, 66, 0.1)",
    borderLeft: "3px solid #7cb342",
    borderRadius: "4px",
    fontWeight: 600,
  },
  button: {
    width: "100%",
    padding: "16px",
    background: "linear-gradient(135deg, #d4af37 0%, #f0c040 100%)",
    color: "#000",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(212, 175, 55, 0.3)",
    letterSpacing: "0.05em",
  },
  error: {
    background: "rgba(231, 76, 60, 0.15)",
    border: "2px solid #e74c3c",
    color: "#ff8a7b",
    padding: "16px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "0.9rem",
    fontWeight: 600,
    borderLeft: "4px solid #e74c3c",
  },
  success: {
    background: "rgba(124, 179, 66, 0.15)",
    border: "2px solid #7cb342",
    color: "#95d82d",
    padding: "16px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "0.9rem",
    fontWeight: 600,
    borderLeft: "4px solid #7cb342",
  },
  requestsList: {
    display: "grid",
    gap: "20px",
  },
  requestCard: {
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)",
    border: "1px solid rgba(212, 175, 55, 0.25)",
    borderRadius: "14px",
    padding: "28px",
    backdropFilter: "blur(15px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    transition: "all 0.3s ease",
  },
  requestHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
    paddingBottom: "18px",
    borderBottom: "1px solid rgba(212, 175, 55, 0.15)",
    gap: "16px",
  },
  requestTitle: {
    fontSize: "1.25rem",
    color: "#d4af37",
    margin: "0 0 8px 0",
    fontWeight: 700,
  },
  requestMeta: {
    color: "#999",
    fontSize: "0.9rem",
    margin: 0,
    fontWeight: 500,
  },
  statusBadge: {
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: 700,
    color: "#000",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    whiteSpace: "nowrap" as const,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
  },
  requestDetails: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "18px",
  },
  detail: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    background: "rgba(212, 175, 55, 0.05)",
    padding: "12px",
    borderRadius: "8px",
    borderLeft: "3px solid rgba(212, 175, 55, 0.2)",
  },
  detailLabel: {
    color: "#999",
    fontSize: "0.8rem",
    textTransform: "uppercase" as const,
    fontWeight: 700,
    letterSpacing: "0.1em",
  },
  detailValue: {
    color: "#e0e0e0",
    fontSize: "0.95rem",
    fontWeight: 600,
  },
  emptyState: {
    textAlign: "center" as const,
    color: "#999",
    padding: "80px 20px",
    fontSize: "1.1rem",
    fontWeight: 300,
  },
};
