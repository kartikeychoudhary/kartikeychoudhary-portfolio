import { useEffect, useRef } from "react";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SCRIPT_ID = "cf-turnstile-script";

function loadScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  const existing = document.getElementById(SCRIPT_ID);
  if (existing) {
    return new Promise((resolve) => existing.addEventListener("load", resolve, { once: true }));
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Failed to load Turnstile"));
    document.head.appendChild(s);
  });
}

export default function Turnstile({ siteKey, onToken, onExpire, theme = "auto" }) {
  const container = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    if (!siteKey || !container.current) return;
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !window.turnstile || !container.current) return;
        widgetId.current = window.turnstile.render(container.current, {
          sitekey: siteKey,
          theme,
          callback: (token) => onToken?.(token),
          "expired-callback": () => onExpire?.(),
          "error-callback": () => onExpire?.(),
        });
      })
      .catch(() => {
        /* user will see a missing token — adapter throws a clear message */
      });

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try { window.turnstile.remove(widgetId.current); } catch { /* noop */ }
        widgetId.current = null;
      }
    };
  }, [siteKey, theme, onToken, onExpire]);

  if (!siteKey) return null;
  return <div ref={container} className="turnstile" />;
}
