import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { StudentProvider } from "../context/StudentContext.jsx";
import Navbar from "./Navbar.jsx";

function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Checking your session...</span>
        </div>
        <p className="mt-3 text-muted">Checking your session...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <StudentProvider>
      <Navbar />
      <Outlet />
    </StudentProvider>
  );
}

export default ProtectedRoute;
