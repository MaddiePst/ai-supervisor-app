import React, { useState, useEffect, useRef } from "react";
import AppSettingsContext from "./AppSettingsContext";
import { changeLanguage, LANGUAGE_OPTIONS } from "../i18n";

const API_BASE = import.meta.env.VITE_API_URL + "/api";
const getToken = () => localStorage.getItem("token");

function doFormatDate(dateStr, format) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  switch (format) {
    case "DD/MM/YYYY": return `${dd}/${mm}/${yyyy}`;
    case "YYYY-MM-DD": return `${yyyy}-${mm}-${dd}`;
    default: return `${mm}/${dd}/${yyyy}`;
  }
}

// ✅ Moved outside component — no dependency issues
async function fetchPreferences() {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const { profile } = await res.json();
    return profile || null;
  } catch {
    return null;
  }
}

async function persistPreferences(lang, fmt) {
  const token = getToken();
  if (!token) return;
  try {
    await fetch(`${API_BASE}/users/preferences`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ preferred_language: lang, preferred_date_format: fmt }),
    });
  } catch { /* silent */ }
}

export default function AppSettingsProvider({ children }) {
  const [language, setLanguage] = useState(
    () => localStorage.getItem("app_language") || "English"
  );
  const [dateFormat, setDateFormat] = useState(
    () => localStorage.getItem("app_date_format") || "MM/DD/YYYY"
  );

  const loadedRef = useRef(false);
  const formatDate = (dateStr) => doFormatDate(dateStr, dateFormat);

  // ── Apply preferences from profile ────────────────────────────────────────
  const applyProfile = (profile) => {
    if (!profile) return false;
    const lang = profile.preferred_language;
    const fmt = profile.preferred_date_format;
    if (lang) {
      setLanguage(lang);
      localStorage.setItem("app_language", lang);
      changeLanguage(lang);
    }
    if (fmt) {
      setDateFormat(fmt);
      localStorage.setItem("app_date_format", fmt);
    }
    return true;
  };

  // ── Load on mount + poll until token available ────────────────────────────
  useEffect(() => {
    if (loadedRef.current) return;

    const tryLoad = async () => {
      const profile = await fetchPreferences();
      if (profile) {
        applyProfile(profile);
        loadedRef.current = true;
        clearInterval(poll);
        clearTimeout(timeout);
      }
    };

    tryLoad();
    const poll = setInterval(tryLoad, 1000);
    const timeout = setTimeout(() => clearInterval(poll), 30000);

    return () => { clearInterval(poll); clearTimeout(timeout); };
  }, []); 

  // ── Reload when token changes (login/logout) ──────────────────────────────
  useEffect(() => {
    const handleStorage = async (e) => {
      if (e.key !== "token") return;
      if (!e.newValue) {
        loadedRef.current = false;
        return;
      }
      loadedRef.current = false;
      const profile = await fetchPreferences();
      if (applyProfile(profile)) loadedRef.current = true;
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // ── Update handlers ────────────────────────────────────────────────────────
  const updateLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("app_language", lang);
    changeLanguage(lang);
    persistPreferences(lang, dateFormat);
  };

  const updateDateFormat = (fmt) => {
    setDateFormat(fmt);
    localStorage.setItem("app_date_format", fmt);
    persistPreferences(language, fmt);
  };

  return (
    <AppSettingsContext.Provider
      value={{ language, dateFormat, updateLanguage, updateDateFormat, formatDate, LANGUAGE_OPTIONS }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
}