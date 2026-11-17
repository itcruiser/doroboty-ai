import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./features/prototype/app";
import { ApplicationErrorBoundary } from "./features/prototype/error-boundary";
import "./app/globals.css";
createRoot(document.getElementById("root")!, {
  // Error text can contain form data. Recovery exposes only a fixed code and build ID.
  onCaughtError: () => {},
}).render(
  <StrictMode>
    <ApplicationErrorBoundary>
      <App />
    </ApplicationErrorBoundary>
  </StrictMode>,
);
