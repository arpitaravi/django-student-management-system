
import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import {
  getStudents,
  createStudent,
  editStudent,
  removeStudent,
} from "../services/studentService";

const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get all students
  async function fetchStudents() {
    try {
      setLoading(true);
      setError("");

      const data = await getStudents();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Load students when the app starts
  useEffect(() => {
    fetchStudents();
  }, []);

  // Add a student
  async function addStudent(studentData) {
    const newStudent = await createStudent(studentData);

    setStudents((previousStudents) => [
      ...previousStudents,
      newStudent,
    ]);

    return newStudent;
  }

  // Delete a student
  async function deleteStudent(id) {
    await removeStudent(id);

    setStudents((previousStudents) =>
      previousStudents.filter(
        (student) => student.id !== id
      )
    );
  }

  // Update a student
  async function updateStudent(id, updatedData) {
    const updatedStudent = await editStudent(
      id,
      updatedData
    );

    setStudents((previousStudents) =>
      previousStudents.map((student) =>
        student.id === id ? updatedStudent : student
      )
    );

    return updatedStudent;
  }

  return (
    <StudentContext.Provider
      value={{
        students,
        setStudents,
        loading,
        error,
        fetchStudents,
        addStudent,
        deleteStudent,
        updateStudent,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}

export function useStudents() {
  return useContext(StudentContext);
}
