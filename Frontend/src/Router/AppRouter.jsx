import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../Components/ProtectedRoute";
import React from "react";
import Login from "../Pages/Login";
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
        <Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
<Route
  path="/addproject"
  element={
    <ProtectedRoute>
      <AddProject />
    </ProtectedRoute>
  }
/>

<Route
  path="/candidates"
  element={
    <ProtectedRoute>
      <Candidates />
    </ProtectedRoute>
  }
/>
<Route
  path="/settings"
  element={
    <ProtectedRoute>
      <Settings />
    </ProtectedRoute>
  }
>
  <Route index path="profile" element={<Profile />} />
  <Route path="notifications" element={<Notifications />} />
  <Route path="appearance" element={<Appearance />} />
</Route>

      </Routes>

    </BrowserRouter>
  );
}
