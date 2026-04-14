import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  PlusSquare,
  Users,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  const linkStyle =
    "flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-white/40 hover:text-[#111827] transition";

  const activeStyle =
    "bg-gradient-to-r from-blue-900 to-cyan-300 text-white shadow";

  const iconStyle = "w-5 h-5 min-w-[20px]";

  return (
    <aside className="w-64 h-90 bg-[#cfd3d7] text-gray-700 backdrop-blur-md border-r border-white/50 p-4 shadow-gray-700 shadow-2xl rounded-3xl m-5">
      
      {/* Logo */}
      <div className="mb-10 mt-6 text-[#111827]">
        <h1 className="text-xl font-bold">Supervisor Assistant</h1>
        <p className="text-sm">AI-Powered Supervisor Assistant</p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2">

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${linkStyle} ${isActive ? activeStyle : ""}`
          }
        >
          <LayoutDashboard className={iconStyle} />
          Dashboard
        </NavLink>

        <NavLink
          to="/addproject"
          className={({ isActive }) =>
            `${linkStyle} ${isActive ? activeStyle : ""}`
          }
        >
          <PlusSquare className={iconStyle} />
          Add Project / Task
        </NavLink>

        <NavLink
          to="/candidates"
          className={({ isActive }) =>
            `${linkStyle} ${isActive ? activeStyle : ""}`
          }
        >
          <Users className={iconStyle} />
          Candidates
        </NavLink>

        <NavLink
          to="/settings/profile"
          className={({ isActive }) =>
            `${linkStyle} ${isActive ? activeStyle : ""}`
          }
        >
          <Settings className={iconStyle} />
          Settings
        </NavLink>

      </nav>
    </aside>
  );
}