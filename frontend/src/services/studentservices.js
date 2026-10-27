const API_URL = `${import.meta.env.VITE_API_URL}/api/students/`;

// 1. Get all students
export async function getStudents() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch students");
  }

  return response.json();
}

// 2. Add a student
export async function createStudent(studentData) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(studentData),
  });

  if (!response.ok) {
    throw new Error("Failed to create student");
  }

  return response.json();
}

// 3. Update a student
export async function editStudent(id, studentData) {
  const response = await fetch(`${API_URL}${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(studentData),
  });

  if (!response.ok) {
    throw new Error("Failed to update student");
  }

  return response.json();
}

// 4. Delete a student
export async function removeStudent(id) {
  const response = await fetch(`${API_URL}${id}/`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete student");
  }
}