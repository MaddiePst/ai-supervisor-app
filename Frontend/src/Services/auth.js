import { supabase } from "../Api/supabaseClient";

const API_URL = import.meta.env.VITE_API;

export const signInWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data.session;
};

export const signUpWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  // session is null if email confirmation is enabled in Supabase
  return data.session;
};

export const fetchMe = async (accessToken) => {
  const res = await fetch(`${API_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Session expired.");
  return data; // { user }
};

export const completeProfile = async (accessToken, role) => {
  const res = await fetch(`${API_URL}/api/auth/complete-profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to complete profile.");
  return data; // { user }
};
