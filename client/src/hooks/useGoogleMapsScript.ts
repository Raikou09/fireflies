import { useState, useEffect } from "react";

type ScriptStatus = "idle" | "loading" | "ready" | "error";

let scriptStatus: ScriptStatus = "idle";
const listeners: Array<(status: ScriptStatus) => void> = [];

function notifyListeners(status: ScriptStatus) {
  scriptStatus = status;
  listeners.forEach((cb) => cb(status));
}

export function useGoogleMapsScript(): ScriptStatus {
  const [status, setStatus] = useState<ScriptStatus>(() => {
    if (typeof window !== "undefined" && (window as any).google?.maps?.places) {
      return "ready";
    }
    return scriptStatus;
  });

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;

    if (!apiKey) {
      console.warn("[Maps] VITE_GOOGLE_API_KEY is not set — address autocomplete disabled.");
      setStatus("error");
      return;
    }

    if ((window as any).google?.maps?.places) {
      console.log("[Maps] Google Maps already loaded.");
      if (scriptStatus !== "ready") notifyListeners("ready");
      else setStatus("ready");
      return;
    }

    if (scriptStatus === "ready") {
      setStatus("ready");
      return;
    }

    if (scriptStatus === "error") {
      setStatus("error");
      return;
    }

    const listener = (s: ScriptStatus) => setStatus(s);
    listeners.push(listener);

    if (scriptStatus === "idle") {
      const existing = document.querySelector(
        `script[src*="maps.googleapis.com"]`
      );
      if (existing) {
        console.log("[Maps] Script tag already in DOM — waiting for load.");
        existing.addEventListener("load", () => notifyListeners("ready"));
        existing.addEventListener("error", () => notifyListeners("error"));
      } else {
        console.log("[Maps] Loading Google Maps script...");
        notifyListeners("loading");

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          console.log("[Maps] Google Maps loaded successfully.");
          notifyListeners("ready");
        };
        script.onerror = (e) => {
          console.error("[Maps] Failed to load Google Maps script:", e);
          notifyListeners("error");
        };
        document.head.appendChild(script);
      }
    }

    return () => {
      const idx = listeners.indexOf(listener);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  return status;
}
