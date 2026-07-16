import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Toggle from "./Toggle";

const API_BASE = import.meta.env.VITE_API_URL + "/api";
const getToken = () => localStorage.getItem("token");

export default function Notifications() {
  const { t } = useTranslation();
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load saved preferences from DB on mount
  useEffect(() => {
    fetch(`${API_BASE}/users/profile`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then(({ profile }) => {
        if (!profile) return;
        setEmailAlerts(profile.email_alerts ?? false);
        setWeeklyReports(profile.weekly_reports ?? false);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Save preference to DB immediately on toggle
  const handleToggle = async (field, value) => {
    if (field === "email_alerts") setEmailAlerts(value);
    if (field === "weekly_reports") setWeeklyReports(value);

    setSaving(true);
    try {
      await fetch(`${API_BASE}/users/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ [field]: value }),
      });
    } catch (err) {
      console.error("Failed to save notification preference:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl p-6 rounded-3xl shadow-2xl bg-[#cfd3d7]">
        <p className="text-sm text-gray-400 animate-pulse">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl p-6 rounded-3xl shadow-2xl bg-[#cfd3d7]">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-semibold">{t("notifications")}</h2>
        {saving && <span className="text-xs text-gray-400 animate-pulse">{t("saving")}</span>}
      </div>

      {/* Email Alerts */}
      <div className="flex justify-between items-start mb-8 pb-8 border-b border-gray-300">
        <div className="max-w-sm">
          <span className="text-lg font-medium">{t("emailAlerts")}</span>
          <p className="text-xs text-gray-500 mt-1">{t("emailAlertsDesc")}</p>
          <div className="mt-3 space-y-1">
            <p className="text-xs text-gray-400">✓ {t("alertTaskUpdate")}</p>
            <p className="text-xs text-gray-400">✓ {t("alertProjectUpdate")}</p>
            <p className="text-xs text-gray-400">✓ {t("alertCalendarEvent")}</p>
          </div>
        </div>
        <Toggle
          enabled={emailAlerts}
          setEnabled={(val) => handleToggle("email_alerts", val)}
        />
      </div>

      {/* Weekly Reports */}
      <div className="flex justify-between items-start mb-8">
        <div className="max-w-sm">
          <span className="text-lg font-medium">{t("weeklyReports")}</span>
          <p className="text-xs text-gray-500 mt-1">{t("weeklyReportsDesc")}</p>
          <div className="mt-3 space-y-1">
            <p className="text-xs text-gray-400">✓ {t("weeklyTaskSummary")}</p>
            <p className="text-xs text-gray-400">✓ {t("weeklyProjectProgress")}</p>
            <p className="text-xs text-gray-400">✓ {t("weeklySentMonday")}</p>
          </div>
        </div>
        <Toggle
          enabled={weeklyReports}
          setEnabled={(val) => handleToggle("weekly_reports", val)}
        />
      </div>
    </div>
  );
}