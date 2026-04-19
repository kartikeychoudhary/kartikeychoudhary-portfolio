const isPlainObject = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v);

export default function deepMerge(base, override) {
  if (!isPlainObject(base)) return override === undefined ? base : override;
  if (!isPlainObject(override)) return override === undefined ? base : override;
  const out = { ...base };
  for (const k of Object.keys(override)) {
    out[k] = isPlainObject(base[k]) && isPlainObject(override[k])
      ? deepMerge(base[k], override[k])
      : override[k];
  }
  return out;
}
