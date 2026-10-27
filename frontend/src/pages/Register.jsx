import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await register({ username: username.trim(), email: email.trim(), password });
      navigate("/login", {
        replace: true,
        state: { message: "Account created. Please sign in." },
      });
    } catch (registerError) {
      setError(registerError.message);
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
              <p className="text-primary fw-semibold text-uppercase small">Join StudentHub</p>
              <h1 className="h2 fw-bold mb-2">Create account</h1>
              <p className="text-secondary mb-4">Create a standard user account to manage student records.</p>
              {error && <div className="alert alert-danger" role="alert">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="register-username" className="form-label">Username</label>
                  <input
                    id="register-username"
                    className="form-control"
                    autoComplete="username"
                    minLength={1}
                    maxLength={150}
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="register-email" className="form-label">Email address</label>
                  <input
                    id="register-email"
                    className="form-control"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="register-password" className="form-label">Password</label>
                  <input
                    id="register-password"
                    className="form-control"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <div className="form-text">Use a password that meets Django’s password rules.</div>
                </div>
                <div className="mb-4">
                  <label htmlFor="register-confirm-password" className="form-label">Confirm password</label>
                  <input
                    id="register-confirm-password"
                    className="form-control"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </div>
                <button className="btn btn-primary btn-lg w-100" disabled={loading}>
                  {loading ? "Creating account..." : "Register"}
                </button>
              </form>
              <p className="text-center text-secondary mt-4 mb-0">
                Already registered? <Link to="/login">Sign in</Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Register;
