import React from "react";
import { Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import useAppSettings from "../../Context/useAppSettings";

const DATE_FORMAT_OPTIONS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

export default function Appearance() {
  const { t } = useTranslation();
  const { language, dateFormat, updateLanguage, updateDateFormat, formatDate, LANGUAGE_OPTIONS } = useAppSettings();
  const today = formatDate(new Date().toISOString());

  return (
    <div className="max-w-3xl p-6 rounded-3xl shadow-2xl bg-[#cfd3d7]">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-semibold">{t("appearanceTitle")}</h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
          <Save className="w-4 h-4" />
          {t("changesInstant")}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold mb-1 text-gray-700">{t("language")}</label>
        <select value={language} onChange={(e) => updateLanguage(e.target.value)}
          className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          {LANGUAGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold mb-1 text-gray-700">{t("dateFormat")}</label>
        <select value={dateFormat} onChange={(e) => updateDateFormat(e.target.value)}
          className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          {DATE_FORMAT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">
          {t("preview")}: <span className="font-semibold text-gray-600">{today}</span>
        </p>
      </div>

      <div className="mt-6 p-4 bg-white rounded-2xl border border-gray-200">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t("preview")}</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-1">{t("dashboard")}</p>
            <p className="font-semibold text-gray-700">{t("addEditProject")}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">{t("dateFormat")}</p>
            <p className="font-semibold text-gray-700">{today}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">{t("tasksTitle")}</p>
            <div className="flex gap-1 flex-wrap">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{t("notStarted")}</span>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{t("inProgress")}</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t("completed")}</span>
            </div>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">{t("candidates")}</p>
            <div className="flex gap-1">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t("selectBtn")}</span>
              <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">{t("hiredBadge")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}