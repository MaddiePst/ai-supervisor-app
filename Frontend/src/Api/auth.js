const API_URL = import.meta.env.VITE_API_URL;

// ─── REGISTER ─────────────────────────────────────────────────────────────────
export const registerUser = async (form) => {
  const res = await fetch(`${API_URL}/api/auth/register`, {
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
    throw new Error(data.message || "Registration failed.");
  }

  return data; // { user, token }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const loginUser = async (email, password) => {
  const res = await fetch(`${API_URL}/api/auth/login`, {
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
  const res = await fetch(`${API_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Session expired.");
  }

  return data; // { user }
};

// ─── COMPLETE PROFILE ─────────────────────────────────────────────────────────
// Called by CompleteProfile page for OAuth users who need to pick a role
export const completeProfile = async (token, role) => {
  const res = await fetch(`${API_URL}/api/users/complete-profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to complete profile.");
  }

  return data;
};

// ─── DELETE CURRENT USER ──────────────────────────────────────────────────────
// Used to roll back an OAuth login/register attempt that violated the mode rule
// (e.g. "log in" with no account, or "register" when an account already exists)
export const deleteMe = async (token) => {
  const res = await fetch(`${API_URL}/api/users/me`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to delete user.");
  }

  return true;
};