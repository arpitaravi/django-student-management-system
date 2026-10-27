const API_BASE_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000");
const API_URL = `${API_BASE_URL}/api/students/`;

async function readError(response, fallbackMessage) {
  const responseText = await response.text();
  let message = responseText;

  try {
    const data = JSON.parse(responseText);
    message = data.detail ?? Object.values(data).flat().join(" ");
  } catch {
    // Keep plain-text server errors readable.
  }

  const error = new Error(message || `${fallbackMessage} (${response.status})`);
  error.status = response.status;
  throw error;
}

async function getCsrfToken() {
  const response = await fetch(`${API_BASE_URL}/api/auth/csrf/`, {
    credentials: "include",
  });
  if (!response.ok) {
    await readError(response, "Unable to initialize secure request");
  }
  return (await response.json()).csrfToken;
}

export async function getStudents() {
  const response = await fetch(API_URL, { credentials: "include" });
  if (!response.ok) {
    await readError(response, "Failed to fetch students");
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function createStudent(studentData) {
  const csrfToken = await getCsrfToken();
  const response = await fetch(API_URL, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify(studentData),
  });

  if (!response.ok) {
    await readError(response, "Failed to create student");
  }
  return response.json();
}

export async function editStudent(id, studentData) {
  const csrfToken = await getCsrfToken();
  const response = await fetch(`${API_URL}${id}/`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify(studentData),
  });

  if (!response.ok) {
    await readError(response, "Failed to update student");
  }
  return response.json();
}

export async function removeStudent(id) {
  const csrfToken = await getCsrfToken();
  const response = await fetch(`${API_URL}${id}/`, {
    method: "DELETE",
    credentials: "include",
    headers: { "X-CSRFToken": csrfToken },
  });

  if (!response.ok) {
    await readError(response, "Failed to delete student");
  }
}
