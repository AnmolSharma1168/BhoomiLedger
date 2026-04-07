"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api.js";

type Tab = "admin-login" | "citizen-login" | "citizen-signup" | "forgot-password";

export default function LoginPage() {

  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("admin-login");

  const [email, setEmail] = useState("admin@bhoomi.com");
  const [password, setPassword] = useState("Admin@1234");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [resetCode, setResetCode] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Signup form states
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");



  async function handleLogin(e: React.FormEvent){

    e.preventDefault();

    setLoading(true);
    setError("");

    try{

      const response = await api.post("/auth/login",{
        email,
        password
      });

      if(response.requiresVerification){

        setVerificationEmail(email);
        setShowVerification(true);
        setLoading(false);

        return;

      }

      // ROLE VALIDATION
      if(activeTab === "admin-login" && response.user.role !== "admin"){

        setError("This account is not an admin account");
        setLoading(false);
        return;

      }

      if(activeTab === "citizen-login" && response.user.role !== "user"){

        setError("This account is not a citizen account");
        setLoading(false);
        return;

      }

      // STORE TOKEN (same keys for both admin and citizen)
      localStorage.setItem("bl_token",response.token);
      localStorage.setItem("bl_user",JSON.stringify(response.user));

      // ROUTE BASED ON ROLE
      if(response.user.role === "admin"){
        router.push("/dashboard");
      }
      else{
        router.push("/portal/dashboard");

      }

    }
    catch(err:any){

      setError(err.message || "Login failed");

    }
    finally{

      setLoading(false);

    }

  }



  async function handleVerification(e:React.FormEvent){

    e.preventDefault();

    setVerificationLoading(true);
    setVerificationError("");

    try{

      const response = await api.post("/auth/verify-email",{

        email:verificationEmail,
        code:verificationCode

      });

      // STORE TOKEN (same keys for both admin and citizen)
      localStorage.setItem("bl_token",response.token);
      localStorage.setItem("bl_user",JSON.stringify(response.user));

      // ROUTE BASED ON ROLE
      if(response.user.role === "admin"){
        router.push("/dashboard");
      }
      else{
        router.push("/portal/dashboard");

      }

    }
    catch(err:any){

      setVerificationError(err.message || "Verification failed");

    }
    finally{

      setVerificationLoading(false);

    }

  }



  async function handleSignup(e: React.FormEvent){

    e.preventDefault();

    setSignupError("");

    if(signupPassword !== signupConfirmPassword){
      setSignupError("Passwords don't match");
      return;
    }

    setSignupLoading(true);

    try{

      const response = await api.post("/auth/register",{
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        role: "user"
      });

      // Signup successful, now show verification prompt
      setVerificationEmail(signupEmail);
      setShowVerification(true);
      setSignupLoading(false);

    }
    catch(err:any){

      setSignupError(err.message || "Signup failed");

    }
    finally{

      setSignupLoading(false);

    }

  }



  async function handleForgotPassword(e:React.FormEvent){

    e.preventDefault();

    setForgotLoading(true);
    setForgotError("");

    try{

      await api.post("/auth/forgot-password",{

        email:forgotEmail

      });

      setResetCodeSent(true);

    }
    catch(err:any){

      setForgotError(err.message || "Failed to send reset code");

    }
    finally{

      setForgotLoading(false);

    }

  }



  async function handleResetPassword(e:React.FormEvent){

    e.preventDefault();

    if(newPassword !== confirmPassword){

      setForgotError("Passwords don't match");
      return;

    }

    setForgotLoading(true);
    setForgotError("");

    try{

      await api.post("/auth/reset-password",{

        email:forgotEmail,
        code:resetCode,
        newPassword

      });

      alert("Password reset successful");

      setActiveTab("admin-login");

      setResetCodeSent(false);

      setForgotEmail("");
      setResetCode("");

      setNewPassword("");
      setConfirmPassword("");

    }
    catch(err:any){

      setForgotError(err.message || "Password reset failed");

    }
    finally{

      setForgotLoading(false);

    }

  }



  async function handleResendCode(){

    try{

      await api.post("/auth/resend-code",{

        email:verificationEmail

      });

      alert("Verification code resent");

    }
    catch{

      setVerificationError("Failed to resend code");

    }

  }



  return (
    <main className="login-root">
      <div className="login-container">
        {/* Header */}
        <div className="login-header">
          <h1 className="login-title">BhoomiLedger</h1>
          <p className="login-subtitle">Blockchain Land Registry</p>
        </div>

        {/* Tabs */}
        <div className="login-tabs">
          <button
            className={`login-tab ${activeTab === "admin-login" ? "active" : ""}`}
            onClick={() => { setActiveTab("admin-login"); setShowVerification(false); }}
          >
            Admin Login
          </button>
          <button
            className={`login-tab ${activeTab === "citizen-login" ? "active" : ""}`}
            onClick={() => { setActiveTab("citizen-login"); setShowVerification(false); }}
          >
            Citizen Login
          </button>
          <button
            className={`login-tab ${activeTab === "citizen-signup" ? "active" : ""}`}
            onClick={() => { setActiveTab("citizen-signup"); setShowVerification(false); }}
          >
            Citizen Signup
          </button>
          <button
            className={`login-tab ${activeTab === "forgot-password" ? "active" : ""}`}
            onClick={() => setActiveTab("forgot-password")}
          >
            Forgot Password
          </button>
        </div>

        {/* Content */}
        <div className="login-content">
          {/* Admin/Citizen Login */}
          {!showVerification && (activeTab === "admin-login" || activeTab === "citizen-login") && (
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label className="label-luxury">Email</label>
                <input
                  type="email"
                  className="input-luxury"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="label-luxury">Password</label>
                <input
                  type="password"
                  className="input-luxury"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="btn-gold" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          )}

          {/* Email Verification */}
          {showVerification && (
            <form onSubmit={handleVerification} className="login-form">
              <div className="verification-message">
                <p>Verification code sent to:</p>
                <p className="verification-email">{verificationEmail}</p>
              </div>

              <div className="form-group">
                <label className="label-luxury">Verification Code</label>
                <input
                  type="text"
                  className="input-luxury"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                />
              </div>

              {verificationError && (
                <div className="error-message">{verificationError}</div>
              )}

              <button type="submit" className="btn-gold" disabled={verificationLoading}>
                {verificationLoading ? "Verifying..." : "Verify Email"}
              </button>

              <button
                type="button"
                className="btn-ghost"
                onClick={handleResendCode}
                style={{ marginTop: "12px" }}
              >
                Resend Code
              </button>
            </form>
          )}

          {/* Citizen Signup */}
          {!showVerification && activeTab === "citizen-signup" && (
            <form onSubmit={handleSignup} className="login-form">
              <div className="form-group">
                <label className="label-luxury">Full Name</label>
                <input
                  type="text"
                  className="input-luxury"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="label-luxury">Email</label>
                <input
                  type="email"
                  className="input-luxury"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="label-luxury">Password</label>
                <input
                  type="password"
                  className="input-luxury"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="form-group">
                <label className="label-luxury">Confirm Password</label>
                <input
                  type="password"
                  className="input-luxury"
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {signupError && <div className="error-message">{signupError}</div>}

              <button type="submit" className="btn-gold" disabled={signupLoading}>
                {signupLoading ? "Creating Account..." : "Create Account"}
              </button>

              <button
                type="button"
                className="btn-ghost"
                onClick={() => setActiveTab("citizen-login")}
                style={{ marginTop: "12px" }}
              >
                Back to Login
              </button>
            </form>
          )}

          {/* Reset Password - Initial */}
          {activeTab === "forgot-password" && !resetCodeSent && (
            <form onSubmit={handleForgotPassword} className="login-form">
              <p className="form-help-text">
                Enter your email address and we'll send you a code to reset your password.
              </p>

              <div className="form-group">
                <label className="label-luxury">Email</label>
                <input
                  type="email"
                  className="input-luxury"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              {forgotError && <div className="error-message">{forgotError}</div>}

              <button type="submit" className="btn-gold" disabled={forgotLoading}>
                {forgotLoading ? "Sending..." : "Send Reset Code"}
              </button>

              <button
                type="button"
                className="btn-ghost"
                onClick={() => setActiveTab("admin-login")}
                style={{ marginTop: "12px" }}
              >
                Back to Login
              </button>
            </form>
          )}

          {/* Reset Password - Code Entry */}
          {activeTab === "forgot-password" && resetCodeSent && (
            <form onSubmit={handleResetPassword} className="login-form">
              <p className="form-help-text">
                Code sent to: <strong>{forgotEmail}</strong>
              </p>

              <div className="form-group">
                <label className="label-luxury">Verification Code</label>
                <input
                  type="text"
                  className="input-luxury"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                />
              </div>

              <div className="form-group">
                <label className="label-luxury">New Password</label>
                <input
                  type="password"
                  className="input-luxury"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="form-group">
                <label className="label-luxury">Confirm Password</label>
                <input
                  type="password"
                  className="input-luxury"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {forgotError && <div className="error-message">{forgotError}</div>}

              <button type="submit" className="btn-gold" disabled={forgotLoading}>
                {forgotLoading ? "Resetting..." : "Reset Password"}
              </button>

              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setResetCodeSent(false);
                  setForgotEmail("");
                  setResetCode("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                style={{ marginTop: "12px" }}
              >
                Back
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>Immutable. Transparent. Sovereign.</p>
        </div>
      </div>

      {/* Admin Credentials Panel */}
      <div className="credentials-panel">
        <div className="credentials-title">🔑 Admin Portal</div>
        <div className="credentials-box">
          <div className="credential-item">
            <span className="label-luxury">EMAIL</span>
            <div className="credential-value">admin@bhoomi.com</div>
          </div>
          <div className="credential-item">
            <span className="label-luxury">PASSWORD</span>
            <div className="credential-value">Admin@1234</div>
          </div>
        </div>
        
        <div className="credentials-divider"></div>
        
        <div className="guide-section">
          <div style={{ fontSize: "11px", letterSpacing: "0.15em", color: "var(--gold)", textTransform: "uppercase", marginBottom: "12px" }}>📖 How to Use</div>
          <div className="guide-content">
            <div className="guide-item">
              <span className="guide-label">1. Add Data</span>
              <span className="guide-text">Login as Admin and use the dashboard to add land parcels, transfers, loans, and other data</span>
            </div>
            <div className="guide-item">
              <span className="guide-label">2. View as Citizen</span>
              <span className="guide-text">Sign up using the same email you used to insert data, then verify to view your records</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        main.login-root {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 48px;
          min-height: 100vh;
          background: var(--black);
          padding: 20px;
          flex-wrap: wrap;
        }

        .login-container {
          width: 100%;
          max-width: 420px;
          border: 1px solid rgba(201, 168, 76, 0.2);
          background: var(--black-3);
          padding: 48px 40px;
          border-radius: 2px;
        }

        .credentials-panel {
          width: 100%;
          max-width: 340px;
          border: 1px solid rgba(201, 168, 76, 0.25);
          background: linear-gradient(135deg, rgba(201,168,76,0.05) 0%, rgba(0,0,0,0) 100%);
          padding: 32px;
          border-radius: 2px;
        }

        .credentials-title {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 600;
          color: var(--gold);
          margin-bottom: 20px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .credentials-box {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 20px;
        }

        .credential-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .credential-value {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--white);
          background: rgba(0,0,0,0.4);
          padding: 10px 12px;
          border-radius: 2px;
          border: 1px solid rgba(201,168,76,0.15);
          letter-spacing: 0.05em;
        }

        .credentials-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent);
          margin: 20px 0;
        }

        .guide-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .guide-content {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .guide-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 12px;
          background: rgba(201,168,76,0.08);
          border: 1px solid rgba(201,168,76,0.15);
          border-radius: 2px;
        }

        .guide-label {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          color: var(--gold);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .guide-text {
          font-family: var(--font-body);
          font-size: 11px;
          color: var(--white-dim);
          line-height: 1.4;
          letter-spacing: 0.02em;
        }

        .login-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .login-title {
          font-family: var(--font-display);
          font-size: 32px;
          font-weight: 600;
          color: var(--gold);
          margin-bottom: 8px;
          letter-spacing: 0.05em;
        }

        .login-subtitle {
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--white-dim);
          letter-spacing: 0.1em;
        }

        .login-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 32px;
          border-bottom: 1px solid rgba(201, 168, 76, 0.1);
          padding-bottom: 16px;
        }

        .login-tab {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--white-dim);
          font-family: var(--font-display);
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 12px 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          border-bottom: 2px solid transparent;
          margin-bottom: -17px;
        }

        .login-tab:hover {
          color: var(--gold-light);
        }

        .login-tab.active {
          color: var(--gold);
          border-bottom-color: var(--gold);
        }

        .login-content {
          margin-bottom: 32px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-help-text {
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--white-dim);
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .verification-message {
          background: rgba(39, 174, 96, 0.08);
          border: 1px solid rgba(39, 174, 96, 0.2);
          padding: 16px;
          border-radius: 2px;
          margin-bottom: 16px;
        }

        .verification-message p {
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--white-dim);
          margin: 0;
        }

        .verification-email {
          color: var(--gold) !important;
          font-weight: 600;
          margin-top: 4px !important;
        }

        .error-message {
          background: rgba(192, 57, 43, 0.12);
          border: 1px solid rgba(192, 57, 43, 0.3);
          padding: 12px 16px;
          border-radius: 2px;
          color: #e74c3c;
          font-family: var(--font-body);
          font-size: 14px;
        }

        .login-footer {
          text-align: center;
          padding-top: 24px;
          border-top: 1px solid rgba(201, 168, 76, 0.1);
        }

        .login-footer p {
          font-family: var(--font-display);
          font-size: 11px;
          letter-spacing: 0.15em;
          color: var(--gold-dim);
          text-transform: uppercase;
        }

        @media (max-width: 900px) {
          main.login-root {
            gap: 20px;
          }
          .credentials-panel {
            max-width: 100%;
          }
        }
      `}</style>
    </main>
  );
}