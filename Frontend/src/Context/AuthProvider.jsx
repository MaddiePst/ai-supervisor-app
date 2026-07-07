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

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("token");
      console.log("restoreSession — token exists:", !!storedToken);
      if (!storedToken) { setLoading(false); return; }
      try {
        const data = await fetchMe(storedToken);
        console.log("restoreSession — fetchMe result:", data);
        setUser(data.user);
        setToken(storedToken);
      } catch (err) {
        console.log("restoreSession — fetchMe failed:", err.message);
        clearAuth();
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
    return data;
  };

  const register = async (form) => {
    const data = await registerUser(form);
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const refreshProfile = async (overrideToken) => {
    const tokenToUse = overrideToken || localStorage.getItem("token");
    if (!tokenToUse) return null;
    try {
      const data = await fetchMe(tokenToUse);
      if (!overrideToken) {
        setUser(data.user);
        setToken(tokenToUse);
      }
      return data.user;
    } catch {
      return null;
    }
  };

  // ✅ Called by Profile.jsx after saving — updates user in context immediately
  // so avatar and name changes reflect everywhere without a page refresh
  const updateUser = (updatedFields) => {
    setUser((prev) => ({ ...prev, ...updatedFields }));
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
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}