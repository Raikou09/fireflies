import { useState, useEffect } from "react";

type ScriptStatus = "idle" | "loading" | "ready" | "error";

let scriptStatus: ScriptStatus = "idle";
const listeners: Array<(status: ScriptStatus) => void> = [];

function notifyListeners(status: ScriptStatus) {
  scriptStatus = status;
  listeners.forEach((cb) => cb(status));
}

export function useGoogleMapsScript(): ScriptStatus {
  const [status, setStatus] = useState<ScriptStatus>(scriptStatus);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;

    if (!apiKey) {
      setStatus("error");
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
      notifyListeners("loading");

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => notifyListeners("ready");
      script.onerror = () => notifyListeners("error");
      document.head.appendChild(script);
    }

    return () => {
      const idx = listeners.indexOf(listener);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  return status;
}
