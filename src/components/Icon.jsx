const PATHS = {
  github: <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.72c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />,
  linkedin: <g><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /><path d="M10 9h4v2a4 4 0 0 1 8 0v10h-4v-8a2 2 0 0 0-4 0v8h-4V9z" /></g>,
  x: <path d="M17.5 3h3.3l-7.2 8.2L22 21h-6.6l-5.2-6.8L4 21H.7l7.7-8.8L.4 3h6.8l4.7 6.2L17.5 3Zm-1.2 16h1.8L7.8 5H5.9l10.4 14Z" />,
  mail: <g><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></g>,
  arrow: <g><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></g>,
  arrow_ne: <g><path d="M7 17 17 7" /><path d="M8 7h9v9" /></g>,
  arrow_left: <g><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></g>,
  arrow_right: <g><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></g>,
  close: <g><path d="M18 6 6 18" /><path d="m6 6 12 12" /></g>,
  plus: <g><path d="M12 5v14" /><path d="M5 12h14" /></g>,
  download: <g><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></g>,
  map: <g><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></g>,
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.84.57 2.8.7A2 2 0 0 1 22 16.92z" />,
  cap: <g><path d="M22 10 12 5 2 10l10 5 10-5z" /><path d="M6 12v5a6 3 0 0 0 12 0v-5" /></g>,
  badge: <g><circle cx="12" cy="9" r="6" /><path d="M9 14.5 8 22l4-2 4 2-1-7.5" /></g>,
  check: <path d="m5 12 5 5L20 7" />,
  clock: <g><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></g>,
  spark: <g><path d="M12 3v4" /><path d="M12 17v4" /><path d="M4.2 4.2l2.8 2.8" /><path d="m17 17 2.8 2.8" /><path d="M3 12h4" /><path d="M17 12h4" /><path d="M4.2 19.8 7 17" /><path d="m17 7 2.8-2.8" /></g>,
  code: <g><path d="m16 18 6-6-6-6" /><path d="m8 6-6 6 6 6" /></g>,
  layers: <g><path d="m12 2 10 5-10 5L2 7l10-5z" /><path d="m2 12 10 5 10-5" /><path d="m2 17 10 5 10-5" /></g>,
  send: <g><path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4 20-7z" /></g>,
  instagram: <g><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></g>,
  alert: <g><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" /></g>,
  info: <g><circle cx="12" cy="12" r="9" /><path d="M12 16v-4" /><path d="M12 8h.01" /></g>,
};

export default function Icon({ name, cls = "i" }) {
  const v = PATHS[name];
  if (!v) return null;
  return (
    <svg className={cls} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {v}
    </svg>
  );
}
