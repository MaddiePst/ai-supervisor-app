import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthCallback from "../Components/AuthCallback";
import ProtectedRoute from "../Components/ProtectedRoute";
import ProjectView from "../Components/Project/ProjectView";
import Appearance from "../Components/Settings/Appearance";
import Notifications from "../Components/Settings/Notifications";
import Profile from "../Components/Settings/Profile";
import AddProject from "../Pages/AddProject";
import Candidates from "../Pages/Candidates";
import Dashboard from "../Pages/Dashboard";
import Login from "../Pages/Login";
import Register from "../Pages/Register";
import Settings from "../Pages/Settings";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
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
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <ProjectView />
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
