import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React from "react";
import App from "../App";
import Login from "../Pages/LogIn";
import Register from "../Pages/Register";

export default function AppRouter() {
  return <BrowserRouter>          
      <Routes>
        <Route path="/" element={<Navigate to="/register" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>

  // return (
  //   // wraps your app and enables client-side routing (URL changes without page reloads).
  //   <BrowserRouter>          
  //     <Routes>
  //       <Route path="/" element={<Navigate to="/login" />} />
  //       <Route path="/login" element={<Login />} />
  //       <Route path="/register" element={<Register />} />
  //     </Routes>
  //   </BrowserRouter>
  // );
}
