import React, { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { loginUser, registerUser, fetchMe } from "../Api/auth";

// Helper to fully clear auth state
const clearAuth = (setUser, setToken, setSession) => {
  console.trace("clearAuth called — token being removed!"); // TEMP LOG
  localStorage.removeItem("token");
  setUser(null);
  setToken(null);
  setSession(null);
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // ✅ Start with null, not localStorage — we verify it first before trusting it
  const [token, setToken] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await fetchMe(storedToken);
        // ✅ Only set token in state if backend confirms it's valid
        setUser(data.user);
        setToken(storedToken);
        setSession({ access_token: storedToken });
      } catch {
        // Token is invalid or user deleted — clear everything immediately
        clearAuth(setUser, setToken, setSession);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    setSession({ access_token: data.token });
    return data;
  };

  const register = async (form) => {
    const data = await registerUser(form);
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    setSession({ access_token: data.token });
    return data;
  };

  const restoreFromToken = async (sessionToken) => {
    const data = await fetchMe(sessionToken);
    localStorage.setItem("token", sessionToken);
    setToken(sessionToken);
    setUser(data.user);
    setSession({ access_token: sessionToken });
    return data;
  };

  const refreshProfile = async () => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) return null;

    try {
      const data = await fetchMe(storedToken);
      setUser(data.user);
      // ✅ Also set token and session so CompleteProfile can use session.access_token
      setToken(storedToken);
      setSession({ access_token: storedToken });
      return data.user;
    } catch {
      clearAuth(setUser, setToken, setSession);
      return null;
    }
  };

  const logout = () => {
    clearAuth(setUser, setToken, setSession);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        session,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        restoreFromToken,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}