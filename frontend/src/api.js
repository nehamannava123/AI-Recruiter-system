export const BASE_URL = "http://127.0.0.1:8000";

function getToken() {
  return localStorage.getItem("ai_recruiter_token");
}

// Wraps fetch: attaches the bearer token automatically and redirects to
// /login if the token has expired or is invalid.
export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (response.status === 401) {
    localStorage.removeItem("ai_recruiter_token");
    localStorage.removeItem("ai_recruiter_user");
    window.location.href = "/login";
    throw new Error("Session expired, please log in again");
  }

  return response;
}
