import { createContext, useContext } from "react";

export const NotifyContext = createContext(null);

export function useNotify() {
  const ctx = useContext(NotifyContext);
  if (!ctx) throw new Error("useNotify must be used inside <NotificationProvider>");
  return ctx;
}
