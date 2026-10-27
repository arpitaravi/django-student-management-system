import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLogoutError("");
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", {
        replace: true,
        state: { message: "You have been signed out." },
      });
    } catch (error) {
      setLogoutError(error.message);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">
            StudentHub
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#studentNavbar"
            aria-controls="studentNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="studentNavbar">
            <div className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
              {!user ? (
                <>
                  <NavLink className="nav-link" to="/" end>Home</NavLink>
                  <NavLink className="nav-link" to="/login">Login</NavLink>
                  <NavLink className="nav-link" to="/register">Register</NavLink>
                </>
              ) : (
                <>
                  <NavLink className="nav-link" to="/dashboard">Dashboard</NavLink>
                  <NavLink className="nav-link" to="/students">Students</NavLink>
                  <NavLink className="nav-link" to="/add-student">Add Student</NavLink>
                  {user.is_staff && (
                    <a className="nav-link" href="/admin/">Admin Panel</a>
                  )}
                  <span className="navbar-text text-white px-lg-2">
                    {user.username}
                  </span>
                  <button
                    className="btn btn-outline-light btn-sm"
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    {loggingOut ? "Signing out..." : "Logout"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      {logoutError && (
        <div className="container mt-2">
          <div className="alert alert-danger mb-0" role="alert">
            Logout failed: {logoutError}
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
