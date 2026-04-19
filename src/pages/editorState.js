export function getAt(obj, path) {
  return path.reduce((o, k) => (o == null ? o : o[k]), obj);
}

export function setAt(obj, path, value) {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  if (Array.isArray(obj)) {
    const copy = obj.slice();
    copy[head] = setAt(copy[head], rest, value);
    return copy;
  }
  return { ...(obj || {}), [head]: setAt((obj || {})[head], rest, value) };
}

export function deleteAt(obj, path) {
  if (path.length === 0) return undefined;
  const [head, ...rest] = path;
  if (rest.length === 0) {
    if (Array.isArray(obj)) return obj.filter((_, i) => i !== head);
    const copy = { ...obj };
    delete copy[head];
    return copy;
  }
  if (Array.isArray(obj)) {
    const copy = obj.slice();
    copy[head] = deleteAt(copy[head], rest);
    return copy;
  }
  return { ...obj, [head]: deleteAt(obj[head], rest) };
}

export function cloneTemplate(value) {
  if (Array.isArray(value)) return value.map(cloneTemplate);
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value)) out[k] = blankForShape(value[k]);
    return out;
  }
  return blankForShape(value);
}

function blankForShape(value) {
  if (Array.isArray(value)) return [];
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value)) out[k] = blankForShape(value[k]);
    return out;
  }
  if (typeof value === "boolean") return false;
  if (typeof value === "number") return 0;
  return "";
}
