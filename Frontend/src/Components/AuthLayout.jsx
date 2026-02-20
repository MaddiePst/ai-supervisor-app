// src/components/AuthLayout.jsx
import React from "react";
import NeuralBackground from "./NeuralBackground";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full flex bg-[#111827] text-gray-300">

      {/* Left Panel */}
      <div className="lg:flex w-1/2 relative h-screen items-center justify-center">
        {/* Neural background fills the panel */}
        <NeuralBackground />

        {/* Overlay text */}
        <div className="relative  text-center p-20">
          <h1 className="text-4xl font-bold mb-4 ">
            AI Supervisor Assistant
          </h1>
          <p className="max-w-md">
            Intelligent oversight for smarter decisions and optimized workflows.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex  w-1/2 h-screen items-center justify-center p-2">
        {children}
      </div>
    </div>
  );
}
