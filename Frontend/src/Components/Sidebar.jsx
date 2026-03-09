import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const linkStyle ="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-white/40 hover:text-[#111827] transition";

  const activeStyle ="bg-gradient-to-r from-blue-900 to-cyan-300 text-white shadow";

  return (
    <aside className="w-64 h-full bg-[#cfd3d7] text-gray-700 backdrop-blur-md border-r border-white/50 p-4 shadow-gray-700 shadow-2xl rounded-3xl m-5">
      {/* Logo */}
      <div className="mb-10 mt-6 text-[#111827]">
        <h1 className="text-xl font-bold ">Supervisor Assistant</h1>
        <p className="text-sm">AI-Powered Supervisor Assistant</p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>`${linkStyle} ${isActive ? activeStyle : ""}`}>
          Dashboard
        </NavLink>

        <NavLink
          to="/menuItem1"
          className={({ isActive }) =>`${linkStyle} ${isActive ? activeStyle : ""}`}>
          Menu Item 1
        </NavLink>

        <NavLink
          to="/menuItem2"
          className={({ isActive }) =>`${linkStyle} ${isActive ? activeStyle : ""}`}>
          Menu Item 2
        </NavLink>

        <NavLink
          to="/settings" 
          className={({ isActive }) => `${linkStyle} ${isActive ? activeStyle : ""}`}>
          Settings
        </NavLink>
      </nav>
    </aside>
  );
}
