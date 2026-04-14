import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React from "react";
import Login from "../Pages/LogIn";
import Register from "../Pages/Register";
import Dashboard from "../Pages/Dashboard";
import Settings from "../Pages/Settings";
import AddProject from "../Pages/AddProject";
import Candidates from "../Pages/Candidates";
import Profile from "../Components/Settings/Profile";
import Notifications from "../Components/Settings/Notifications";
import Appearance from "../Components/Settings/Appearance";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/addproject" element={<AddProject />} />
        <Route path="/candidates" element={<Candidates />} />
        {/* <Route path="/settings/profile" element={<Settings />} /> */}
    {/* Settings layout */}
    <Route path="/settings" element={<Settings />}>
      <Route index path="profile" element={<Profile />} /> {/* default */}
      <Route path="notifications" element={<Notifications />} />
      <Route path="appearance" element={<Appearance />} />
    </Route>
      </Routes>
    </BrowserRouter>
  );
}
