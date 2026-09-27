"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
const preferenceKey = "ipes:install-choice";
export function Pwa() {
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production")
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    const listener = (e: Event) => {
      e.preventDefault();
      try {
        if (localStorage.getItem(preferenceKey)) return;
      } catch {}
      setInstall(e as InstallEvent);
    };
    const installed = () => {
      try {
        localStorage.setItem(preferenceKey, "installed");
      } catch {}
      setInstall(null);
    };
    window.addEventListener("beforeinstallprompt", listener);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", listener);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  function remember(value: string) {
    try {
      localStorage.setItem(preferenceKey, value);
    } catch {}
    setDismissed(true);
    setInstall(null);
  }
  return install && !dismissed ? (
    <span className="install-control">
      <button
        type="button"
        className="install-small"
        onClick={async () => {
          try {
            await install.prompt();
            const choice = await install.userChoice;
            remember(choice.outcome === "accepted" ? "accepted" : "dismissed");
          } catch {
            remember("dismissed");
          }
        }}
      >
        <Download size={16} /> Instalar
      </button>
      <button
        type="button"
        className="install-dismiss"
        aria-label="Não sugerir instalação novamente"
        onClick={() => remember("dismissed")}
      >
        <X size={14} />
      </button>
    </span>
  ) : null;
}
