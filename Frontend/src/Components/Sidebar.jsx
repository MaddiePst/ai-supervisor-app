import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, FolderEdit, Users, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();

  const linkStyle =
    "flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-white/40 hover:text-[#111827] transition whitespace-nowrap";
  const activeStyle = "bg-gradient-to-r from-blue-900 to-cyan-300 text-white shadow";
  const iconStyle = "w-5 h-5 min-w-[20px]";
  const settingsActive = location.pathname.startsWith("/settings");

  return (
    <aside className="w-60 shrink-0 h-fit bg-[#cfd3d7] text-gray-700 backdrop-blur-md border-r border-white/50 p-4 shadow-gray-700 shadow-2xl rounded-3xl m-5">
      <div className="mb-10 mt-6 text-[#111827]">
        <h1 className="text-xl font-bold">{t("appName")}</h1>
        <p className="text-sm">{t("appTagline")}</p>
      </div>
      <nav className="flex flex-col gap-2">
        <NavLink to="/dashboard" className={({ isActive }) => `${linkStyle} ${isActive ? activeStyle : ""}`}>
          <LayoutDashboard className={iconStyle} />{t("dashboard")}
        </NavLink>
        <NavLink to="/addproject" className={({ isActive }) => `${linkStyle} ${isActive ? activeStyle : ""}`}>
          <FolderEdit className={iconStyle} />{t("addEditProject")}
        </NavLink>
        <NavLink to="/candidates" className={({ isActive }) => `${linkStyle} ${isActive ? activeStyle : ""}`}>
          <Users className={iconStyle} />{t("candidates")}
        </NavLink>
        <NavLink to="/settings/profile" className={`${linkStyle} ${settingsActive ? activeStyle : ""}`}>
          <Settings className={iconStyle} />{t("settings")}
        </NavLink>
      </nav>
    </aside>
  );
}