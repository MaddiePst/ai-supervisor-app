import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProjectView from "../Components/Project/ProjectView";
import Appearance from "../Components/Settings/Appearance";
import Notifications from "../Components/Settings/Notifications";
import Profile from "../Components/Settings/Profile";
import AddProject from "../Pages/AddProject";
import Candidates from "../Pages/Candidates";
import Dashboard from "../Pages/Dashboard";
import Login from "../Pages/LogIn";
import Register from "../Pages/Register";
import Settings from "../Pages/Settings";

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
        <Route path="/projects/:id" element={<ProjectView />} />
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
