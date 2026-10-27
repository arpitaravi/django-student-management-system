
import { useState } from "react";
import { Link } from "react-router-dom";
import { useStudents } from "../context/useStudents.js";

function AddStudent() {
  const { addStudent } = useStudents();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setIsSuccess(false);

    if (!name.trim()) {
      setMessage("Please enter the student's name.");
      return;
    }

    if (!email.trim()) {
      setMessage("Please enter an email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage("Please enter a valid email address.");
      return;
    }

    if (!age || !Number.isFinite(Number(age)) || Number(age) <= 0) {
      setMessage("Please enter a valid age greater than zero.");
      return;
    }

    setLoading(true);

    try {
      await addStudent({
        name: name.trim(),
        email: email.trim(),
        age: Number(age),
      });

      setMessage("Student added successfully!");
      setIsSuccess(true);

      setName("");
      setEmail("");
      setAge("");
    } catch (error) {
      setMessage(error.message || "Unable to add student. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-9 col-lg-7 col-xl-6">
          <div className="mb-4">
            <Link
              to="/students"
              className="text-decoration-none text-secondary"
            >
              ← Back to Students
            </Link>
          </div>

          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4 p-md-5">
              <div className="mb-4">
                <span className="badge text-bg-primary mb-3">
                  STUDENT MANAGEMENT
                </span>

                <h1 className="h3 fw-bold mb-2">Add New Student</h1>

                <p className="text-secondary mb-0">
                  Enter the student details below to create a new record.
                </p>
              </div>

              {message && (
                <div
                  className={`alert ${
                    isSuccess ? "alert-success" : "alert-danger"
                  }`}
                  role="alert"
                >
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="studentName" className="form-label fw-semibold">
                    Student Name
                  </label>

                  <input
                    id="studentName"
                    type="text"
                    className="form-control form-control-lg"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter full name"
                    autoComplete="name"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="studentEmail" className="form-label fw-semibold">
                    Email Address
                  </label>

                  <input
                    id="studentEmail"
                    type="email"
                    className="form-control form-control-lg"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="student@example.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="studentAge" className="form-label fw-semibold">
                    Age
                  </label>

                  <input
                    id="studentAge"
                    type="number"
                    className="form-control form-control-lg"
                    value={age}
                    onChange={(event) => setAge(event.target.value)}
                    placeholder="Enter age"
                    min="1"
                    max="120"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100"
                  disabled={loading}
                >
                  {loading ? "Saving Student..." : "Add Student"}
                </button>

                <Link
                  to="/students"
                  className="btn btn-outline-secondary w-100 mt-3"
                >
                  View Student Records
                </Link>
              </form>
            </div>
          </div>

          <p className="text-center text-secondary small mt-3">
            Student records are managed through the Django REST API.
          </p>
        </div>
      </div>
    </main>
  );
}

export default AddStudent;
