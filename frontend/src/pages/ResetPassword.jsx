import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  checkPasswordResetAuthorization,
} from "../services/authService.js";
import { useAuth } from "../context/useAuth.js";

function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    checkPasswordResetAuthorization()
      .then((isAuthorized) => {
        if (active) setAuthorized(isAuthorized);
      })
      .catch((statusError) => {
        if (active) {
          setError(statusError.message);
          setAuthorized(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (authorized === null) {
    return (
      <main className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Checking verification...</span>
        </div>
        <p className="mt-3 text-secondary">Checking your verification...</p>
      </main>
    );
  }

  if (!authorized) {
    return (
      <Navigate
        to="/forgot-password"
        replace
        state={{ message: error || "Verify your email before resetting your password." }}
      />
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(password, confirmPassword);
      navigate("/login", {
        replace: true,
        state: { message: "Password reset successfully. Please sign in with your new password." },
      });
    } catch (resetError) {
      setError(resetError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-10 col-md-7 col-lg-5">
          <section className="card border-0 shadow-sm">
            <div className="card-body p-4 p-md-5">
              <p className="text-primary fw-semibold text-uppercase small">New credentials</p>
              <h1 className="h2 fw-bold mb-2">Reset Password</h1>
              <p className="text-secondary mb-4">Choose a new password for your account.</p>
              {error && <div className="alert alert-danger" role="alert">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="new-password" className="form-label">New Password</label>
                  <input
                    id="new-password"
                    className="form-control form-control-lg"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label htmlFor="confirm-new-password" className="form-label">Confirm New Password</label>
                  <input
                    id="confirm-new-password"
                    className="form-control form-control-lg"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </div>
                <div className="form-check mb-3">
                  <input
                    id="show-reset-password"
                    className="form-check-input"
                    type="checkbox"
                    checked={showPassword}
                    onChange={(event) => setShowPassword(event.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="show-reset-password">
                    Show passwords
                  </label>
                </div>
                <div className="form-text mb-4">
                  Your password must follow Django’s configured password rules, including the minimum length and common-password checks.
                </div>
                <button className="btn btn-primary btn-lg w-100" disabled={loading}>
                  {loading ? "Resetting password..." : "Reset Password"}
                </button>
              </form>
              <p className="text-center mt-4 mb-0"><Link to="/login">Back to Login</Link></p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default ResetPassword;
