import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

function ForgotPassword() {
  const { requestPasswordResetCode } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestPasswordResetCode(email.trim());
      navigate("/verify-otp");
    } catch (requestError) {
      setError(requestError.message);
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
              <p className="text-primary fw-semibold text-uppercase small">Account recovery</p>
              <h1 className="h2 fw-bold mb-2">Forgot Password?</h1>
              <p className="text-secondary mb-4">
                Enter your registered email address to receive a verification code.
              </p>
              {error && <div className="alert alert-danger" role="alert">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="forgot-email" className="form-label">Email address</label>
                  <input
                    id="forgot-email"
                    className="form-control form-control-lg"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
                <button className="btn btn-primary btn-lg w-100" disabled={loading}>
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2" role="status" />Sending...</>
                  ) : "Send Verification Code"}
                </button>
              </form>
              <p className="text-center mt-4 mb-0">
                <Link to="/login">Back to Login</Link>
              </p>
              <p className="text-secondary text-center small mt-3 mb-0" role="status">
                We’ll show the same confirmation whether or not an account exists.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default ForgotPassword;
