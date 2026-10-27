
import { useStudents } from "../context/useStudents.js";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

function Dashboard() {
  const { students, loading, error } = useStudents();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div
          className="spinner-border text-primary"
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          Unable to load students: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Welcome Section */}
      <div className="p-4 p-md-5 mb-4 bg-primary text-white rounded-4 shadow-sm">
        <h1 className="fw-bold">Welcome, {user.username}</h1>

        <p className="mb-4">
          Your student management dashboard. Review the directory or add a student.
        </p>

        <Link
          to="/students"
          className="btn btn-light me-2 mb-2"
        >
          View Students
        </Link>

        <Link
          to="/add-student"
          className="btn btn-outline-light mb-2"
        >
          + Add Student
        </Link>
      </div>

      {/* Dashboard Heading */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="fw-bold mb-1">Overview</h2>
          <p className="text-muted mb-0">
            Student records summary
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-muted mb-2">Total Students</p>
              <h2 className="fw-bold text-primary">
                {students.length}
              </h2>
              <small className="text-muted">
                All registered students
              </small>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-muted mb-2">Student Records</p>
              <h2 className="fw-bold text-success">
                {students.length}
              </h2>
              <small className="text-muted">
                Available in the system
              </small>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-muted mb-2">Quick Action</p>
              <h5 className="fw-bold">Add Student</h5>
              <Link
                to="/add-student"
                className="btn btn-success btn-sm mt-2"
              >
                Add New
              </Link>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-muted mb-2">Manage Records</p>
              <h5 className="fw-bold">Student List</h5>
              <Link
                to="/students"
                className="btn btn-outline-primary btn-sm mt-2"
              >
                View All
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Section */}
      <div className="card border-0 shadow-sm mt-4">
        <div className="card-body p-4">
          <h4 className="fw-bold">Account information</h4>
          <p className="text-muted mb-3">
            Signed in as <strong>{user.username}</strong> ({user.email || "No email provided"}).
          </p>

          <Link
            to="/students"
            className="btn btn-primary"
          >
            Manage Students
          </Link>
          {user.is_staff && (
            <a className="btn btn-outline-dark ms-2" href="/admin/">
              Open Admin Panel
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
