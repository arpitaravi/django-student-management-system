import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

function Home() {
  const { user } = useAuth();

  return (
    <main className="container py-5">
      <section className="p-4 p-md-5 rounded-4 bg-primary text-white shadow-sm">
        <p className="text-uppercase fw-semibold small mb-2">Student management system</p>
        <h1 className="display-5 fw-bold">Manage student records with confidence.</h1>
        <p className="lead col-lg-8 mt-3">
          A secure, simple workspace to keep student details organized and up to date.
        </p>
        <div className="d-flex flex-wrap gap-2 mt-4">
          {user ? (
            <Link className="btn btn-light btn-lg" to="/dashboard">
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link className="btn btn-light btn-lg" to="/login">
                Sign in
              </Link>
              <Link className="btn btn-outline-light btn-lg" to="/register">
                Create account
              </Link>
            </>
          )}
        </div>
      </section>
      <section className="row g-4 mt-2">
        <div className="col-md-4">
          <article className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h2 className="h5 fw-bold">Secure access</h2>
              <p className="text-secondary mb-0">
                Student records are available only after signing in.
              </p>
            </div>
          </article>
        </div>
        <div className="col-md-4">
          <article className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h2 className="h5 fw-bold">One student directory</h2>
              <p className="text-secondary mb-0">
                Find records and update student details in one place.
              </p>
            </div>
          </article>
        </div>
        <div className="col-md-4">
          <article className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h2 className="h5 fw-bold">Role-aware administration</h2>
              <p className="text-secondary mb-0">
                Django staff permissions protect administrative tools.
              </p>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

export default Home;
