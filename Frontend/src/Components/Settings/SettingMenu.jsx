import React from "react";
import { NavLink } from "react-router-dom";
import { User, Bell, Palette } from "lucide-react";

export default function SettingMenu() {
  const linkStyle =
    "flex items-center gap-2 px-4 py-2 rounded-xl text-gray-500 hover:bg-white/40 hover:text-[#111827] transition";

  const activeStyle =
    "bg-gradient-to-r from-blue-900 to-cyan-300 text-white shadow";

    const iconStyle = "w-5 h-5 min-w-[20px] min-h-[20px]";

  return (
    <aside className="w-45 h-40 bg-[#cfd3d7] text-gray-700 backdrop-blur-md border-r border-white/50 p-3 shadow-gray-700 shadow-2xl rounded-3xl ">
      {/* Navigation */}
      <nav className="flex flex-col">
        <NavLink
          to="/settings/profile"
          className={({ isActive }) =>
            `${linkStyle} ${isActive ? activeStyle : ""}`
          }
        ><User className={iconStyle} />
          Profile
        </NavLink>

        <NavLink
          to="/settings/notifications"
          className={({ isActive }) =>
            `${linkStyle} ${isActive ? activeStyle : ""}`
          }
        ><Bell className={iconStyle} />
          Notifications
        </NavLink>

        <NavLink
          to="/settings/appearance"
          className={({ isActive }) =>
            `${linkStyle} ${isActive ? activeStyle : ""}`
          }
        ><Palette className={iconStyle} />
         Appearance 
        </NavLink>
      </nav>
    </aside>
  );
}
