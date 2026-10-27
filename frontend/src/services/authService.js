const API_BASE_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000");
const AUTH_URL = `${API_BASE_URL}/api/auth`;

async function parseResponse(response) {
  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }

  if (!response.ok) {
    const message = data.detail ?? Object.values(data).flat().join(" ");
    throw new Error(message || `Request failed (${response.status})`);
  }
  return data;
}

export async function getCsrfToken() {
  const response = await fetch(`${AUTH_URL}/csrf/`, {
    credentials: "include",
  });
  return (await parseResponse(response)).csrfToken;
}

export async function getCurrentUser() {
  const response = await fetch(`${AUTH_URL}/me/`, {
    credentials: "include",
  });
  if (response.status === 401) {
    return null;
  }
  return (await parseResponse(response)).user;
}

export async function registerUser(userData, csrfToken) {
  const response = await fetch(`${AUTH_URL}/register/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify(userData),
  });
  return parseResponse(response);
}

export async function loginUser(credentials, csrfToken) {
  const response = await fetch(`${AUTH_URL}/login/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify(credentials),
  });
  return parseResponse(response);
}

export async function logoutUser(csrfToken) {
  const response = await fetch(`${AUTH_URL}/logout/`, {
    method: "POST",
    credentials: "include",
    headers: { "X-CSRFToken": csrfToken },
  });
  return parseResponse(response);
}

export async function requestPasswordReset(email) {
  const csrfToken = await getCsrfToken();
  const response = await fetch(`${AUTH_URL}/forgot-password/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify({ email }),
  });
  return parseResponse(response);
}

export async function verifyPasswordResetOtp(email, code) {
  const csrfToken = await getCsrfToken();
  const response = await fetch(`${AUTH_URL}/verify-otp/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify({ email, code }),
  });
  return parseResponse(response);
}

export async function checkPasswordResetAuthorization() {
  const response = await fetch(`${AUTH_URL}/reset-password/status/`, {
    credentials: "include",
  });
  if (response.status === 403) {
    return false;
  }
  await parseResponse(response);
  return true;
}

export async function submitPasswordReset(password, confirmPassword) {
  const csrfToken = await getCsrfToken();
  const response = await fetch(`${AUTH_URL}/reset-password/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify({
      password,
      confirm_password: confirmPassword,
    }),
  });
  return parseResponse(response);
}
