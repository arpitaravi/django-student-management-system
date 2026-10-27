import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

function maskEmail(email) {
  const [localPart, domain] = email.split("@");
  if (!domain) return "your email address";
  const visible = localPart.length > 1 ? localPart.slice(0, 1) : "";
  return `${visible}${"*".repeat(Math.max(2, localPart.length - visible.length))}@${domain}`;
}

function VerifyOTP() {
  const {
    passwordResetEmail,
    requestPasswordResetCode,
    verifyPasswordResetCode,
  } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  if (!passwordResetEmail) {
    return <Navigate to="/forgot-password" replace />;
  }

  async function handleVerify(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      await verifyPasswordResetCode(code);
      navigate("/reset-password", { replace: true });
    } catch (verifyError) {
      setError(verifyError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setMessage("");
    setResending(true);
    try {
      await requestPasswordResetCode(passwordResetEmail);
      setCode("");
      setMessage("If an account exists for this email, a new code has been sent. Any previous code is invalid.");
    } catch (resendError) {
      setError(resendError.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-10 col-md-7 col-lg-5">
          <section className="card border-0 shadow-sm">
            <div className="card-body p-4 p-md-5">
              <p className="text-primary fw-semibold text-uppercase small">Email verification</p>
              <h1 className="h2 fw-bold mb-2">Verify your code</h1>
              <p className="text-secondary mb-1">
                Enter the six-digit code sent to <strong>{maskEmail(passwordResetEmail)}</strong>.
              </p>
              <p className="form-text mb-4">The code expires five minutes after it was sent.</p>
              {message && <div className="alert alert-success" role="status">{message}</div>}
              {error && <div className="alert alert-danger" role="alert">{error}</div>}
              <form onSubmit={handleVerify}>
                <div className="mb-4">
                  <label htmlFor="verification-code" className="form-label">Six-digit verification code</label>
                  <input
                    id="verification-code"
                    className="form-control form-control-lg text-center"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                  />
                </div>
                <button className="btn btn-primary btn-lg w-100" disabled={loading || code.length !== 6}>
                  {loading ? "Verifying..." : "Verify Code"}
                </button>
              </form>
              <button
                className="btn btn-outline-secondary w-100 mt-3"
                type="button"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? "Sending..." : "Resend Code"}
              </button>
              <p className="text-center mt-4 mb-0">
                <Link to="/forgot-password">Use a different email</Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default VerifyOTP;
