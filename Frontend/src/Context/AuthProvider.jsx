import React, { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { loginUser, registerUser, fetchMe } from "../Api/auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearAuth = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  };

  // Restore session on page load
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchMe(storedToken);
        setUser(data.user);
        setToken(storedToken);
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  // Email/password login — goes through backend
  const login = async (email, password) => {
    const data = await loginUser(email, password);
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  // Email/password register — goes through backend
  const register = async (form) => {
    const data = await registerUser(form);
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  // Called by AuthCallback after OAuth redirect — token comes from Supabase
  // Does NOT store token until we know the flow is valid
  const refreshProfile = async (overrideToken) => {
    const tokenToUse = overrideToken || localStorage.getItem("token");
    if (!tokenToUse) return null;
    try {
      const data = await fetchMe(tokenToUse);
      // Only update state if no override — override means we haven't validated yet
      if (!overrideToken) {
        setUser(data.user);
        setToken(tokenToUse);
      }
      return data.user;
    } catch {
      return null;
    }
  };

  const logout = () => clearAuth();

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}