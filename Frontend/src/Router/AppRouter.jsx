import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React from "react";
import Login from "../Pages/LogIn";
import Register from "../Pages/Register";
import Dashboard from "../Pages/Dashboard";
import Settings from "../Pages/Settings";
import AddProject from "../Pages/AddProject";
import Candidates from "../Pages/Candidates";

export default function AppRouter() {
  return <BrowserRouter>          
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/addproject" element={<AddProject />} />
        <Route path="/candidates" element={<Candidates />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>

}
