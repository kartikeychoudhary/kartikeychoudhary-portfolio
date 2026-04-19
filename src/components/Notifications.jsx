import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { NotifyContext } from "./notify.js";
import env from "@env";

const ICON_BY_TYPE = {
  success: "check",
  error: "alert",
  warning: "alert",
  info: "info",
};

export function NotificationProvider({ children }) {
  const cfg = env.notifications || {};
  const pos = cfg.position || "bottom-right";
  const durationMs = cfg.durationMs ?? 4500;
  const maxStack = cfg.maxStack ?? 3;

  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const tm = timersRef.current.get(id);
    if (tm) {
      clearTimeout(tm);
      timersRef.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    ({ type = "success", title, message, duration }) => {
      const id = ++idRef.current;
      setToasts((list) => {
        const next = [...list, { id, type, title, message }];
        return next.slice(-maxStack);
      });
      const ms = duration ?? durationMs;
      if (ms > 0) {
        const tm = setTimeout(() => dismiss(id), ms);
        timersRef.current.set(id, tm);
      }
      return id;
    },
    [dismiss, durationMs, maxStack]
  );

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current.clear();
    };
  }, []);

  return (
    <NotifyContext.Provider value={{ notify, dismiss }}>
      {children}
      <div className={`toast-host pos-${pos}`}>
        {toasts.map((t) => (
          <div key={t.id} className={`toast type-${t.type}`} role="status">
            <div className="bubble">
              <Icon name={ICON_BY_TYPE[t.type] || "check"} />
            </div>
            <div className="body">
              {t.title && <p className="ttl">{t.title}</p>}
              {t.message && <p className="msg">{t.message}</p>}
            </div>
            <span className="close-x" onClick={() => dismiss(t.id)}>×</span>
          </div>
        ))}
      </div>
    </NotifyContext.Provider>
  );
}
