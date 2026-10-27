import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(location.state?.message ?? "");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ username: username.trim(), password });
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (loginError) {
      setError(loginError.message);
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
              <p className="text-primary fw-semibold text-uppercase small">Welcome back</p>
              <h1 className="h2 fw-bold mb-2">Sign in</h1>
              <p className="text-secondary mb-4">Access your student management dashboard.</p>
              {error && <div className="alert alert-danger" role="alert">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="login-username" className="form-label">Username</label>
                  <input
                    id="login-username"
                    className="form-control form-control-lg"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="login-password" className="form-label">Password</label>
                  <div className="input-group input-group-lg">
                    <input
                      id="login-password"
                      className="form-control"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="text-end mt-2">
                    <Link to="/forgot-password" className="small text-decoration-none">
                      Forgot Password?
                    </Link>
                  </div>
                </div>
                <button className="btn btn-primary btn-lg w-100" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>
              <p className="text-center text-secondary mt-4 mb-0">
                Don&apos;t have an account? <Link to="/register">Register</Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Login;
