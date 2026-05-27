// ─── TOKEN HELPERS ────────────────────────────────────────────────────────────
// These are simple localStorage utilities used outside of React context
// (e.g. in plain JS files). Inside components always use useAuth() instead.

export const getToken = () => localStorage.getItem("token");

export const setToken = (token) => localStorage.setItem("token", token);

export const removeToken = () => localStorage.removeItem("token");

// Returns true if a token string exists in storage.
// Does NOT verify the token with the backend — use AuthContext for that.
export const isAuthenticated = () => !!localStorage.getItem("token");