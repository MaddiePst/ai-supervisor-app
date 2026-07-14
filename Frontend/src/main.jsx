import "./i18n"; 
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./Context/AuthProvider";
import  AppSettingsProvider from "./Context/AppSettingsProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AppSettingsProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </AppSettingsProvider>
);