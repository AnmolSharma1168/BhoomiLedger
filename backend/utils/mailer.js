const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const templates = {
  parcelRegistered: (parcelId, ownerName) => ({
    subject: `BhoomiLedger — Parcel ${parcelId} Registered`,
    html: `
      <div style="background:#080808;color:#f5f0e8;padding:2rem;font-family:sans-serif;max-width:600px">
        <h2 style="color:#d4af37;letter-spacing:0.1em">BHOOMILEDGER</h2>
        <hr style="border-color:#d4af3733;margin:1rem 0"/>
        <h3>Land Parcel Registered ✅</h3>
        <p>Dear <strong>${ownerName}</strong>,</p>
        <p>Your land parcel has been successfully registered on the BhoomiLedger blockchain registry.</p>
        <div style="background:#111;border:1px solid #d4af3733;padding:1rem;margin:1rem 0">
          <p style="color:#d4af37;font-size:0.8rem;letter-spacing:0.1em">PARCEL ID</p>
          <p style="font-size:1.2rem;font-weight:bold">${parcelId}</p>
        </div>
        <p style="color:#888;font-size:0.85rem">This is an automated notification from BhoomiLedger.</p>
      </div>
    `
  }),

  transferInitiated: (transferId, parcelId, sellerName, buyerName, amount) => ({
    subject: `BhoomiLedger — Transfer ${transferId} Initiated`,
    html: `
      <div style="background:#080808;color:#f5f0e8;padding:2rem;font-family:sans-serif;max-width:600px">
        <h2 style="color:#d4af37;letter-spacing:0.1em">BHOOMILEDGER</h2>
        <hr style="border-color:#d4af3733;margin:1rem 0"/>
        <h3>Transfer Initiated 🔄</h3>
        <div style="background:#111;border:1px solid #d4af3733;padding:1rem;margin:1rem 0">
          <p><strong>Transfer ID:</strong> ${transferId}</p>
          <p><strong>Parcel ID:</strong> ${parcelId}</p>
          <p><strong>Seller:</strong> ${sellerName}</p>
          <p><strong>Buyer:</strong> ${buyerName}</p>
          <p><strong>Amount:</strong> ₹${Number(amount).toLocaleString("en-IN")}</p>
        </div>
        <p style="color:#888;font-size:0.85rem">This is an automated notification from BhoomiLedger.</p>
      </div>
    `
  }),

  transferCompleted: (transferId, parcelId, buyerName) => ({
    subject: `BhoomiLedger — Transfer ${transferId} Completed ✅`,
    html: `
      <div style="background:#080808;color:#f5f0e8;padding:2rem;font-family:sans-serif;max-width:600px">
        <h2 style="color:#d4af37;letter-spacing:0.1em">BHOOMILEDGER</h2>
        <hr style="border-color:#d4af3733;margin:1rem 0"/>
        <h3>Transfer Completed ✅</h3>
        <p>Ownership of parcel <strong>${parcelId}</strong> has been transferred to <strong>${buyerName}</strong>.</p>
        <p><strong>Transfer ID:</strong> ${transferId}</p>
        <p style="color:#888;font-size:0.85rem">This is an automated notification from BhoomiLedger.</p>
      </div>
    `
  }),

  loanCreated: (loanId, borrowerName, principal, emiAmount) => ({
    subject: `BhoomiLedger — Loan ${loanId} Approved`,
    html: `
      <div style="background:#080808;color:#f5f0e8;padding:2rem;font-family:sans-serif;max-width:600px">
        <h2 style="color:#d4af37;letter-spacing:0.1em">BHOOMILEDGER</h2>
        <hr style="border-color:#d4af3733;margin:1rem 0"/>
        <h3>Loan Approved 💰</h3>
        <p>Dear <strong>${borrowerName}</strong>, your loan has been approved.</p>
        <div style="background:#111;border:1px solid #d4af3733;padding:1rem;margin:1rem 0">
          <p><strong>Loan ID:</strong> ${loanId}</p>
          <p><strong>Principal:</strong> ₹${Number(principal).toLocaleString("en-IN")}</p>
          <p><strong>Monthly EMI:</strong> ₹${Number(emiAmount).toLocaleString("en-IN")}</p>
        </div>
        <p style="color:#888;font-size:0.85rem">This is an automated notification from BhoomiLedger.</p>
      </div>
    `
  }),

  verifyEmail: (code) => ({
    subject: "BhoomiLedger — Email Verification Code",
    html: `
      <div style="background:#080808;color:#f5f0e8;padding:2rem;font-family:sans-serif;max-width:600px">
        <h2 style="color:#d4af37;letter-spacing:0.1em">BHOOMILEDGER</h2>
        <hr style="border-color:#d4af3733;margin:1rem 0"/>
        <h3>Verify Your Email ✉️</h3>
        <p>Welcome to BhoomiLedger! Please verify your email address with the code below.</p>
        <div style="background:#d4af37;color:#080808;padding:1.5rem;margin:1.5rem 0;text-align:center;border-radius:4px">
          <p style="font-size:0.8rem;letter-spacing:0.1em;margin:0;opacity:0.8">VERIFICATION CODE</p>
          <p style="font-size:2rem;font-weight:bold;margin:0.5rem 0;font-family:monospace">${code}</p>
        </div>
        <p style="color:#888;font-size:0.85rem">This code expires in 15 minutes. Do not share it with anyone.</p>
      </div>
    `
  }),

  forgotPassword: (code) => ({
    subject: "BhoomiLedger — Password Reset Code",
    html: `
      <div style="background:#080808;color:#f5f0e8;padding:2rem;font-family:sans-serif;max-width:600px">
        <h2 style="color:#d4af37;letter-spacing:0.1em">BHOOMILEDGER</h2>
        <hr style="border-color:#d4af3733;margin:1rem 0"/>
        <h3>Reset Your Password 🔐</h3>
        <p>We received a request to reset your password. Use the code below to proceed.</p>
        <div style="background:#d4af37;color:#080808;padding:1.5rem;margin:1.5rem 0;text-align:center;border-radius:4px">
          <p style="font-size:0.8rem;letter-spacing:0.1em;margin:0;opacity:0.8">RESET CODE</p>
          <p style="font-size:2rem;font-weight:bold;margin:0.5rem 0;font-family:monospace">${code}</p>
        </div>
        <p style="color:#888;font-size:0.85rem">This code expires in 15 minutes. If you didn't request this, please ignore this email.</p>
      </div>
    `
  }),
};

async function sendMail(to, template) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("📧 Email skipped — EMAIL_USER/EMAIL_PASS not set");
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: template.subject,
      html: template.html,
    });
    console.log(`✅ Email sent to ${to}: ${template.subject}`);
  } catch (err) {
    console.error("❌ Email failed:", err.message);
  }
}

module.exports = { sendMail, templates };