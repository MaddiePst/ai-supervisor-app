import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Components/Sidebar";
import SettingMenu from "../Components/Settings/SettingMenu";

export default function Settings() {
  return (
    <div className="min-h-screen bg-[#c5c7ca] text-gray-800 flex">
      <Sidebar />

      <div className="p-3 w-5xl">
        <h1 className="text-2xl font-bold ">Settings</h1>
        <p className="text-gray-600 mb-6">
          Manage your account preferences and application settings.
        </p>

        <div className="flex">
          <div className="w-1/5">
            <SettingMenu />
          </div>

         <div className="w-4/5">
  <Outlet />
</div>
        </div>
      </div>
    </div>
  );
}
