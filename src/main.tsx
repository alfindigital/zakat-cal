import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

/**
 * Service worker (offline shell + installability).
 * Registered ONLY in a real production browsing context: never in dev, never
 * inside an iframe/preview host, and never when `?sw=off` is present — those
 * contexts get any stale registration cleaned up instead.
 */
function shouldRegisterServiceWorker(): boolean {
  if (!import.meta.env.PROD) return false;
  if (window.top !== window.self) return false;
  if (new URLSearchParams(window.location.search).has("sw")) return false;
  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return false;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return false;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return false;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return false;
  return true;
}

if ("serviceWorker" in navigator) {
  if (shouldRegisterServiceWorker()) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* SW registration is best-effort */
      });
    });
  } else {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) =>
        regs
          .filter((r) => (r.active?.scriptURL ?? "").endsWith("/sw.js"))
          .forEach((r) => void r.unregister()),
      )
      .catch(() => {
        /* cleanup is best-effort */
      });
  }
}

