# Property Documents Feature - Complete Implementation

## 📋 Feature Overview
A complete document approval workflow system where citizens upload property documents and admins review/approve them before documents are linked to properties.

---

## 🗄️ 1. DATABASE MODEL

**File:** `/backend/models/DocumentRequest.js`

```javascript
{
  parcelId: String (required),           // Property ID
  ownerId: ObjectId (ref: User),         // Citizen who uploaded
  ownerName: String,                     // Name of owner
  ownerEmail: String,                    // Email of owner
  documentName: String (required),       // e.g., "Title Deed 2024"
  documentType: Enum {
    'title_deed',
    'survey_report',
    'tax_receipt',
    'ownership_proof',
    'other'
  },
  documentUrl: String (required),        // File path to uploaded document
  documentSize: Number,                  // File size in bytes
  status: Enum {
    'pending' (default),
    'approved',
    'rejected'
  },
  rejectionReason: String,               // Why admin rejected (if rejected)
  approvedBy: ObjectId (ref: User),      // Which admin approved
  approvedAt: Date,                      // When approved
  rejectedAt: Date,                      // When rejected
  createdAt: Date (default: now),        // Submission timestamp
  updatedAt: Date (default: now)         // Last update timestamp
}
```

**Audit Trail:**
- All approvals logged with `approvedBy` and `approvedAt`
- Rejections tracked with `rejectionReason` and `rejectedAt`
- Creation and update timestamps maintained

---

## 🔌 2. BACKEND ROUTES & API

**File:** `/backend/routes/documents.js`

### Citizen Endpoints (Protected by auth middleware)

#### 1. **Upload Document**
```
POST /api/documents/upload
Headers: Authorization: Bearer {token}
Body: FormData {
  parcelId: string,
  documentName: string,
  documentType: string,
  document: File (PDF/JPG/PNG, max 15MB)
}

Response: {
  success: true,
  message: "Document uploaded successfully. Awaiting admin approval.",
  documentRequest: {...}
}

Rules:
- Only uploads for properties user owns
- Status: pending
- Document NOT added to property yet
```

#### 2. **Get My Document Requests**
```
GET /api/documents/my-requests?status=pending|approved|rejected&page=1&limit=10

Response: {
  success: true,
  total: number,
  requests: [DocumentRequest]
}

Shows:
- All documents user uploaded
- Current status (pending/approved/rejected)
- Rejection reasons if applicable
```

#### 3. **Download Document**
```
GET /api/documents/download/:id

Access:
- Document owner can download
- Admins can download
- File must exist

Returns: File download
```

### Admin Endpoints (Protected by role check)

#### 1. **Get Pending Requests**
```
GET /api/documents/admin/pending?page=1&limit=20&search=query

Response: {
  success: true,
  total: number,
  requests: [DocumentRequest]
}

Shows: Only status='pending' documents
Search: By propertyId, ownerName, ownerEmail
```

#### 2. **Get All Requests**
```
GET /api/documents/admin/all?status=approved&page=1&limit=20&search=query

Shows: All documents (pending, approved, rejected)
Filter: By status
```

#### 3. **Approve Document**
```
POST /api/documents/admin/approve/:id

Actions:
1. Update status to 'approved'
2. Set approvedBy = current admin ID
3. Set approvedAt = now
4. Add document to parcel's documents array
5. Return updated DocumentRequest

Response: {
  success: true,
  message: "Document approved and linked to property",
  documentRequest: {...}
}
```

#### 4. **Reject Document**
```
POST /api/documents/admin/reject/:id
Body: {
  rejectionReason: string (required)
}

Actions:
1. Update status to 'rejected'
2. Store rejectionReason
3. Set rejectedAt = now
4. DELETE uploaded file
5. Document NOT added to property

Response: {
  success: true,
  message: "Document rejected",
  documentRequest: {...}
}
```

#### 5. **Get Statistics**
```
GET /api/documents/admin/stats

Response: {
  success: true,
  stats: {
    pending: 5,
    approved: 23,
    rejected: 2,
    total: 30
  }
}

For: Admin dashboard widgets
```

**Security Rules:**
- All endpoints require authentication
- Only admins can approve/reject
- Only owners can upload for their properties
- File access restricted to owners and admins
- Rejected files are permanently deleted

---

## 🎨 3. CITIZEN PORTAL UI CHANGES

**File:** `/frontend/src/app/dashboard/documents/page.tsx`

### Features:

**Tab 1: Upload Document**
- Select Property dropdown (filtered to user's properties)
- Document Type selector (Title Deed, Survey Report, etc.)
- Document Name input field
- File upload (drag-drop, PDF/JPG/PNG, 15MB max)
- Success/Error messages
- Visual feedback showing file name and size

**Tab 2: My Requests**
Shows list of all documents uploaded:
- Document name and property ID
- Document type
- Submission date
- Status badge (Pending/Approved/Rejected)
- Approval/Rejection date
- Rejection reason (if applicable)

**Design Theme:**
- Luxury gold (#d4af37) for accents
- Dark background (gradient)
- Glass-morphism panels
- Responsive grid layout

**Access Path:** 
- Tab: `/dashboard/documents` from citizen nav menu
- Or: Navigate from admin/citizen portal
- Shows only user's own documents

---

## 👨‍💼 4. ADMIN PORTAL UI CHANGES

**File:** `/frontend/src/app/dashboard/admin-documents/page.tsx`

### Features:

**Statistics Cards**
- Pending count
- Approved count
- Rejected count
- Total documents

**Filter Controls**
- "Pending Only" button → shows only pending
- "All Requests" button → shows all with status
- Real-time search by: Property ID, Owner Name, Email

**Document Request Cards** (for each document)
Left Section:
- Document name (gold colored)
- Property ID, Document Type, Submission Date
- Owner name and email
- Preview link (opens in new tab)
- Download button

Right Section (Actions):
**If Pending:**
- Green "✓ Approve" button
  - Instantly approves
  - Adds to property
  - Removes from list

- Red "✗ Reject" button
  - Expands to form
  - Text area: "Reason for rejection..."
  - "Reject" and "Cancel" buttons
  - Stores reason, deletes file

**If Already Processed:**
- Status badge (Approved/Rejected)
- Rejection reason displayed (if rejected)
- Read-only view

**Pagination:**
- 20 items per page
- Auto-refresh after approve/reject

**Design:**
- Same luxury gold theme
- Admin-focused: efficient layout
- Quick action buttons
- Clear status indicators

**Access Path:**
- `/dashboard/admin-documents`
- Only accessible to admin role
- Appears in admin nav menu

---

## 📡 5. API CLIENT ADDITIONS

**File:** `/frontend/src/lib/api.js`

```javascript
// Added method:
get: (path) => request(path)

// Usage in documents pages:
api.get("/documents/my-requests")
api.get("/documents/admin/pending")
api.get("/documents/admin/all")
api.get("/documents/admin/stats")
```

---

## 🔐 6. SECURITY & MIDDLEWARE

### Authentication Middleware
```javascript
// All routes protected by: auth.protect middleware
router.get("/documents/admin/pending", auth.protect, ...)

// Checks:
1. Valid JWT token required
2. req.user populated with user data
3. Token includes user role and ID
```

### Authorization Checks

**Role-based:**
```javascript
if (req.user.role !== "admin") {
  return res.status(403).json({ 
    success: false, 
    message: "Only admins can access this" 
  });
}
```

**Ownership Checks:**
```javascript
// For upload: Only allow for owned properties
const isOwner = 
  (parcel.ownerId.toString() === req.user._id.toString()) ||
  (parcel.ownerEmail === req.user.email) ||
  (parcel.ownerName === req.user.name);

// For download: Owner or admin
const isOwner = docRequest.ownerId.toString() === req.user._id.toString();
const isAdmin = req.user.role === "admin";
if (!isOwner && !isAdmin) return 403;
```

**File Validation:**
```javascript
fileFilter: (req, file, cb) => {
  const allowed = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error("Only PDF and images allowed"));
}
```

---

## 🗂️ 7. FILE STRUCTURE

```
BhoomiLedger/
├── backend/
│   ├── models/
│   │   └── DocumentRequest.js          [NEW]
│   ├── routes/
│   │   └── documents.js               [NEW]
│   └── server.js                      [UPDATED - added /documents route]
│
└── frontend/
    ├── src/app/
    │   └── dashboard/
    │       ├── documents/
    │       │   └── page.tsx            [NEW - Citizen upload UI]
    │       └── admin-documents/
    │           └── page.tsx            [NEW - Admin approval UI]
    └── src/lib/
        └── api.js                      [UPDATED - added get() method]
```

**Upload Directory:**
```
backend/
└── uploads/
    └── documents/          [Created automatically on first upload]
        ├── 1712865432-deed.pdf
        ├── 1712865433-survey.jpg
        └── ...
```

---

## 🚀 8. WORKFLOW EXAMPLE

### Citizen Uploads Document:
```
1. Citizen navigates to /dashboard/documents
2. Selects property they own
3. Chooses "Title Deed"
4. Names it "Main Property Deed 2024"
5. Uploads PDF file
6. ✓ Document request created with status='pending'
7. File saved to: uploads/documents/[timestamp]-[name].pdf
8. Citizen sees: "Submitted on Apr 7, 2024 - Status: Pending"
```

### Admin Reviews & Approves:
```
1. Admin navigates to /dashboard/admin-documents
2. Sees: 5 pending documents
3. Clicks on citizen's document
4. Previews PDF in new tab
5. Clicks "✓ Approve"
6. Document linked to property
7. Document visible to citizen as "Approved - Apr 7, 2024"
```

### Admin Reviews & Rejects:
```
1. Admin sees another document
2. Clicks "✗ Reject"
3. Types: "Poor quality image, needs clear scan"
4. Clicks "Reject"
5. File deleted from server
6. Citizen sees: "Rejected - Poor quality image, needs clear scan"
7. Citizen can re-upload new version
```

---

## ✅ IMPLEMENTATION COMPLETE

**All Components:**
- ✅ Database model with audit trail
- ✅ 8 backend API endpoints with security
- ✅ Citizen upload & tracking UI
- ✅ Admin approval/rejection UI
- ✅ File upload with multer
- ✅ Role-based access control
- ✅ Ownership verification
- ✅ Complete error handling

**Testing Paths:**
1. **Citizen:** `/dashboard/documents` → Upload tab
2. **Admin:** `/dashboard/admin-documents` → Review & approve/reject
3. **Tests:** See verification working with mock blockchain

---

## 📊 FUTURE ENHANCEMENTS

Possible additions:
- Document versioning (track upload history)
- Bulk upload support
- OCR for document scanning
- Automated document type detection
- Email notifications on approval/rejection
- Document templates/forms
- Comment/note system for admins
- Audit log viewer for admins
- Document storage on IPFS/blockchain
