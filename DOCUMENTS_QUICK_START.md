## 🎯 PROPERTY DOCUMENTS FEATURE - QUICK START

### ✅ WHAT WAS BUILT

A complete **Document Upload & Approval Workflow** where:
- Citizens upload property documents (PDF, JPG, PNG)
- Admin reviews and approves/rejects them
- Approved documents get linked to property records
- Rejection reasons are tracked for audit trail

---

## 🚀 HOW TO TEST

### 1️⃣ Citizen - Upload Document

**Step 1:** Login as Citizen
```
URL: http://localhost:3000/login
Tab: Citizen Login
Email: hl1845@srmist.edu.in
Password: Citizen@1234
Verify with code: (check your email or last API response)
```

**Step 2:** Navigate to Documents
```
After login, look for documents option in portal navigation
OR direct: http://localhost:3000/dashboard/documents
```

**Step 3:** Upload Document
```
1. Click "📤 Upload Document" tab
2. Select Property (dropdown with your properties)
3. Choose Document Type (Title Deed, Survey Report, etc.)
4. Enter Document Name (e.g., "Main Deed 2024")
5. Select PDF/JPG/PNG file (max 15MB)
6. Click "📤 Upload Document"
7. See: "Document uploaded successfully! Awaiting admin approval."
```

**Step 4:** Track Status
```
1. Click "📋 My Requests" tab
2. See all your uploaded documents
3. Status shows: Pending | Approved | Rejected
4. If rejected, shows rejection reason
5. If approved, shows approval date
```

---

### 2️⃣ Admin - Review & Approve

**Step 1:** Login as Admin
```
URL: http://localhost:3000/login
Tab: Admin Login
Email: admin@bhoomi.com
Password: Admin@1234
Verify with code: (check your email or last API response)
```

**Step 2:** Navigate to Document Requests
```
After login, look for documents option in admin navigation
OR direct: http://localhost:3000/dashboard/admin-documents
```

**Step 3:** Review Pending Documents
```
Page shows:
- Statistics: Pending (5), Approved (23), Rejected (2)

Filter Options:
- "⏳ Pending Only" → shows only pending
- "📊 All Requests" → shows pending + approved + rejected

Search:
- By Property ID
- By Owner Name
- By Owner Email

Each Document Card Shows:
- Document name (gold)
- Property ID
- Document Type
- Submission Date
- Owner name & email
- "👁️ Preview Document" link
- "⬇️ Download" button
```

**Step 4: Approve Document**
```
1. Review the document (click Preview)
2. If acceptable, click "✓ Approve"
3. System will:
   - Mark as approved
   - Link to property
   - Show "Document approved and linked to property"
   - Remove from pending list
4. Citizen will see: "Status: Approved - Apr 7, 2024"
```

**Step 5: Reject Document**
```
1. Review the document
2. If not acceptable, click "✗ Reject"
3. Text area appears: "Reason for rejection..."
4. Type reason (e.g., "Low quality image, needs clear scan")
5. Click "Reject"
6. System will:
   - Mark as rejected
   - Store rejection reason
   - DELETE uploaded file permanently
7. Citizen will see: "Status: Rejected"
   - Reason: "Low quality image..."
8. Citizen can re-upload new version
```

---

## 🔗 API ENDPOINTS (For Testing with Postman/cURL)

### Citizen Endpoints

**Upload Document**
```
POST http://localhost:3001/api/documents/upload
Headers: Authorization: Bearer {jwt_token}
         Content-Type: multipart/form-data
Body:
  - parcelId: "PL001" (property ID)
  - documentName: "Title Deed" (document name)
  - documentType: "title_deed" (or: survey_report, tax_receipt, etc.)
  - document: <File> (PDF/JPG/PNG)
```

**Get My Requests**
```
GET http://localhost:3001/api/documents/my-requests?status=pending&page=1&limit=10
Headers: Authorization: Bearer {jwt_token}
```

**Download Document**
```
GET http://localhost:3001/api/documents/download/{documentId}
Headers: Authorization: Bearer {jwt_token}
```

### Admin Endpoints

**Get Pending Requests**
```
GET http://localhost:3001/api/documents/admin/pending?page=1&limit=20
Headers: Authorization: Bearer {jwt_token}
```

**Get All Requests**
```
GET http://localhost:3001/api/documents/admin/all?status=approved&page=1
Headers: Authorization: Bearer {jwt_token}
```

**Approve Document**
```
POST http://localhost:3001/api/documents/admin/approve/{documentId}
Headers: Authorization: Bearer {jwt_token}
         Content-Type: application/json
Body: {}
```

**Reject Document**
```
POST http://localhost:3001/api/documents/admin/reject/{documentId}
Headers: Authorization: Bearer {jwt_token}
         Content-Type: application/json
Body: {
  "rejectionReason": "Poor quality scanned image"
}
```

**Get Statistics**
```
GET http://localhost:3001/api/documents/admin/stats
Headers: Authorization: Bearer {jwt_token}
```

---

## 📁 FILES MODIFIED/CREATED

### Backend
```
✅ NEW: backend/models/DocumentRequest.js
        - Database schema with audit trail
        - Status tracking (pending/approved/rejected)
        - Rejection reason storage

✅ NEW: backend/routes/documents.js
        - 8 endpoints (citizen + admin)
        - File upload with multer
        - Security checks

✅ UPDATED: backend/server.js
           - Registered /documents routes
```

### Frontend
```
✅ NEW: frontend/src/app/dashboard/documents/page.tsx
        - Citizen: Upload documents
        - Show status & history
        - Approve/reject tracking

✅ NEW: frontend/src/app/dashboard/admin-documents/page.tsx
        - Admin: Review pending docs
        - Dashboard stats
        - Approve/reject with reasons

✅ UPDATED: frontend/src/lib/api.js
           - Added get() method for API calls
```

### Documentation
```
✅ NEW: PROPERTY_DOCUMENTS_FEATURE.md
        - Complete implementation guide
        - Database schema explained
        - All endpoints documented
        - Security rules
        - Workflow examples
```

---

## 🎨 UI FEATURES

### Citizen Portal (`/dashboard/documents`)
- 📤 **Upload Tab**
  - Property selector (filtered to owned)
  - Document type dropdown
  - File upload with validation
  - Success/error messages
  
- 📋 **My Requests Tab**
  - List all uploaded documents
  - Status badges (Pending/Approved/Rejected)
  - Document details
  - Rejection reasons (if applicable)

### Admin Portal (`/dashboard/admin-documents`)
- 📊 **Statistics**
  - Pending, Approved, Rejected counts
  - Total documents
  
- 🔍 **Filters & Search**
  - View pending only or all
  - Search by property/owner/email
  - Real-time filter updates

- ✅ **Approve Actions**
  - Click "✓ Approve"
  - Document instantly linked to property
  - Real-time list update

- ❌ **Reject with Reasons**
  - Click "✗ Reject"
  - Modal shows "Reason:" input
  - Store rejection reason
  - Delete file automatically

---

## 🔒 SECURITY FEATURES

✅ **Authentication Required**
   - All endpoints protected by JWT token
   - Login required for citizen/admin features

✅ **Authorization Checks**
   - Citizens can only upload for their own properties
   - Citizens can only download their own documents
   - Admins can only approve/reject/download

✅ **File Validation**
   - Accepted: PDF, JPG, JPEG, PNG, WEBP
   - Max size: 15MB
   - File extension validation
   - MIME type checking

✅ **Audit Trail**
   - Track who approved (approvedBy)
   - When approved (approvedAt)
   - Rejection reasons stored
   - Creation timestamps
   - Update timestamps

✅ **Data Privacy**
   - Rejected files permanently deleted
   - No unauthorized document access
   - Ownership verification on every action

---

## 📊 WORKFLOW DIAGRAM

```
CITIZEN                           ADMIN
  │                                 │
  ├─ Upload Document ──────────────>│
  │  (Status: pending)              │
  │                                 │
  │  View Status                    │
  │  (Pending badge)    ┌──────────┤
  │                     │Review Doc │
  │                     │           │
  │  [Wait for Admin]   │ Approve? ┐│
  │                     └──────────┤│
  │<─── Email Notif ──────────────┐│
  │     (Approved)                 │├─ Linked to Property
  │     Document Visible          ││   File: uploads/documents/[id]
  │                                │  
  │                      Or Reject?┐│
  │                     └──────────┤│
  │<─── Email Notif ──────────────┐│
  │     (Rejected + Reason)        │├─ File Deleted
  │     Can Re-upload             ││  Store reason
  │                                │
```

---

## 🧪 QUICK TEST CHECKLIST

- [ ] Citizen can upload document
- [ ] Document status shows "Pending"
- [ ] Admin can see pending documents
- [ ] Admin can preview document
- [ ] Admin can download document
- [ ] Admin can approve (status → Approved)
- [ ] Admin can reject with reason
- [ ] Rejected files deleted from server
- [ ] Citizens see rejection reason
- [ ] Citizens can re-upload rejected docs
- [ ] Statistics update in real-time
- [ ] Search works by property/owner/email
- [ ] Only owners can upload for their properties
- [ ] Only admins can approve/reject
- [ ] Audit trail maintained (approvedBy, timestamps)

---

## 💡 NEXT FEATURES TO ADD

1. **Email Notifications**
   - Send when document submitted
   - Send when approved
   - Send when rejected with reason

2. **Document Versioning**
   - Keep history of uploads
   - Track which version approved
   - Allow re-uploads alongside old versions

3. **Bulk Actions**
   - Approve multiple docs
   - Reject multiple docs
   - Export reports

4. **Document Templates**
   - Pre-defined document types
   - Required fields per type
   - Auto-populate common info

5. **Blockchain Storage**
   - Store document hash on smart contract
   - Immutable audit trail
   - Decentralized verification

6. **OCR Integration**
   - Auto-scan documents
   - Extract text/data
   - Flag incomplete documents

---

## 🚀 CURRENT SYSTEM STATUS

```
✅ Backend:     Running on http://localhost:3001
   - auth      ✓ Working
   - parcels   ✓ Working
   - documents ✓ NEW - Ready
   - transfers ✓ Working
   - loans     ✓ Working
   - blockchain → Mock ✓ Working

✅ Frontend:    Running on http://localhost:3000
   - Login     ✓ Working (with verification)
   - Admin Portal    ✓ New page: /dashboard/admin-documents
   - Citizen Portal  ✓ New page: /dashboard/documents

✅ Database:    MongoDB connected
   - User      ✓ Working
   - Parcel    ✓ Working
   - DocumentRequest ✓ NEW
   - Loan      ✓ Working
```

---

**Everything is ready to test! 🎉**

Start with a quick test:
1. Login as citizen
2. Go to `/dashboard/documents`
3. Upload a document
4. Switch to admin
5. Go to `/dashboard/admin-documents`
6. Approve or reject the document
