import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { initInstallPrompt } from "./pwa/installPrompt";
import { registerServiceWorker } from "./pwa/registerServiceWorker";
import { AppSettingsProvider } from "./settings/AppSettingsContext";
import "./styles/global.css";

registerServiceWorker();
initInstallPrompt();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppSettingsProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppSettingsProvider>
  </StrictMode>
);
