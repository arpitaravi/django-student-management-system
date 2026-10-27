
import { useStudents } from "../context/useStudents.js";
import { useState, useMemo } from "react";

function Students() {
  const {
    students,
    loading,
    error,
    deleteStudent,
    updateStudent,
  } = useStudents();

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) =>
      student.name.toLowerCase().includes(query)
    );
  }, [students, search]);

  function startEdit(student) {
    setEditingId(student.id);
    setName(student.name);
    setEmail(student.email);
    setAge(String(student.age));
    setMessage("");
  }

  async function handleUpdate(event) {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !age) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (Number(age) < 1) {
      setMessage("Age must be at least 1.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await updateStudent(editingId, {
        name: name.trim(),
        email: email.trim(),
        age: Number(age),
      });

      setEditingId(null);
      setMessage("Student updated successfully!");
    } catch (err) {
      setMessage(err.message || "Unable to update student.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this student?"
    );

    if (!confirmed) return;

    setMessage("");

    try {
      await deleteStudent(id);
      setMessage("Student deleted successfully!");
    } catch (err) {
      setMessage(err.message || "Unable to delete student.");
    }
  }

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading student records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">
          Unable to load students: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Page heading */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Student Management</h2>
          <p className="text-muted mb-0">
            View, search, update and manage student records.
          </p>
        </div>

        <a href="/add-student" className="btn btn-primary">
          + Add Student
        </a>
      </div>

      {/* Summary cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <p className="text-muted mb-2">Total Students</p>
              <h2 className="fw-bold text-primary mb-0">
                {students.length}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <p className="text-muted mb-2">Matching Records</p>
              <h2 className="fw-bold text-success mb-0">
                {filteredStudents.length}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Student table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-3 p-md-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <h4 className="fw-bold mb-0">Student Records</h4>

            <div style={{ width: "100%", maxWidth: "320px" }}>
              <input
                type="search"
                className="form-control"
                placeholder="Search by student name..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search students by name"
              />
            </div>
          </div>

          {message && (
            <div
              className={`alert ${
                message.toLowerCase().includes("successfully")
                  ? "alert-success"
                  : "alert-danger"
              }`}
              role="status"
            >
              {message}
            </div>
          )}

          {filteredStudents.length === 0 ? (
            <div className="text-center py-5">
              <h5 className="fw-semibold">No student records found</h5>
              <p className="text-muted mb-0">
                {search
                  ? "Try another student name."
                  : "Add a student to get started."}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Student Name</th>
                    <th scope="col">Email Address</th>
                    <th scope="col">Age</th>
                    <th scope="col" className="text-end">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="text-muted">{student.id}</td>

                      <td>
                        <span className="fw-semibold">
                          {student.name}
                        </span>
                      </td>

                      <td>{student.email}</td>

                      <td>{student.age}</td>

                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm me-2 mb-1"
                          onClick={() => startEdit(student)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm mb-1"
                          onClick={() => handleDelete(student.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="text-muted small mt-3">
            Showing {filteredStudents.length} of {students.length} student records
          </div>
        </div>
      </div>

      {/* Edit form */}
      {editingId !== null && (
        <div className="card border-0 shadow-sm mt-4" id="edit-student-form">
          <div className="card-body p-4">
            <h4 className="fw-bold mb-1">
              Edit Student
            </h4>
            <p className="text-muted mb-4">
              Update the details for student ID {editingId}.
            </p>

            <form onSubmit={handleUpdate}>
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={age}
                    onChange={(event) => setAge(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-4">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? "Saving Changes..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={() => {
                    setEditingId(null);
                    setMessage("");
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;
