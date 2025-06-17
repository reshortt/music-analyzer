import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ServerProvider } from "./layers/ServerProvider.tsx";
import "@vscode-elements/elements/dist/bundled.js";
import "@vscode-elements/elements/dist/main.d.ts";
// @ts-expect-error
window.__vscodeElements_disableRegistryWarning__ = true;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ServerProvider>
      <App />
    </ServerProvider>
  </StrictMode>
);
