import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/useAuth";

export default function ManagerRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role !== "manager") return <Navigate to="/dashboard" replace />;
  return children;
}