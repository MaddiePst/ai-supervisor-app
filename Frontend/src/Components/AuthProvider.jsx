import React, { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { loginUser, registerUser, fetchMe } from "../Api/auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
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
        setUser(data.user);
        setToken(storedToken);
      } catch {
        localStorage.removeItem("token");
        setUser(null);
        setToken(null);
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

  // Called by AuthCallback after Google/Apple OAuth redirect
  // Fetches the user profile using the Supabase session token
  const restoreFromToken = async (sessionToken) => {
    const data = await fetchMe(sessionToken);
    localStorage.setItem("token", sessionToken);
    setToken(sessionToken);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        restoreFromToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}