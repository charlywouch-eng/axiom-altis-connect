import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress uncaught error popups in production
if (import.meta.env.PROD) {
  window.addEventListener("error", (e) => {
    e.preventDefault();
    console.error("[AXIOM]", e.error);
  });
  window.addEventListener("unhandledrejection", (e) => {
    e.preventDefault();
    console.error("[AXIOM]", e.reason);
  });
}

createRoot(document.getElementById("root")!).render(<App />);
