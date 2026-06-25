import React, { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { loginUser, registerUser, fetchMe } from "../Api/auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearAuth = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
    setSession(null);
  };

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
        setSession({ access_token: storedToken });
      } catch {
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

  // ✅ refreshProfile never clears auth — it just returns null on failure
  // This lets AuthCallback handle the token independently
  const refreshProfile = async (overrideToken) => {
    const tokenToUse = overrideToken || localStorage.getItem("token");
    if (!tokenToUse) return null;
    try {
      const data = await fetchMe(tokenToUse);
      setUser(data.user);
      setToken(tokenToUse);
      setSession({ access_token: tokenToUse });
      return data.user;
    } catch {
      return null;
    }
  };

  const logout = () => {
    clearAuth();
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
