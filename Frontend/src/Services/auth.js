const API_URL = import.meta.env.VITE_API;


// ─── REGISTER ─────────────────────────────────────────────────────────────────
export const registerUser = async (form) => {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: form.full_name,
      email: form.email,
      password: form.password,
      role: form.role,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    // Throw the backend's message so the page can show it directly
    throw new Error(data.message || "Registration failed.");
  }

  return data; // { user, token }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const loginUser = async (email, password) => {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Login failed.");
  }

  return data; // { user, token }
};

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────
// Called by AuthContext on every page load to restore session from stored token
export const fetchMe = async (token) => {
  const res = await fetch(`${API_URL}/api/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Session expired.");
  }

  return data; // { user }
};