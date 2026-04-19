import { useState } from "react";
import { cloneTemplate } from "./editorState.js";

const humanize = (key) =>
  String(key)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

function isMultiline(v) {
  return typeof v === "string" && (v.length > 80 || v.includes("\n"));
}

function isPrimitive(v) {
  return v === null || ["string", "number", "boolean"].includes(typeof v);
}

export default function FieldRenderer({ path, value, onChange, onDelete, label }) {
  const key = label ?? path[path.length - 1];

  if (typeof value === "boolean") {
    return (
      <label className="ed-field ed-bool">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(path, e.target.checked)}
        />
        <span>{humanize(key)}</span>
      </label>
    );
  }

  if (typeof value === "number") {
    return (
      <label className="ed-field">
        <span className="ed-label">{humanize(key)}</span>
        <input
          type="number"
          className="ed-input"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => {
            const n = e.target.value === "" ? 0 : Number(e.target.value);
            onChange(path, Number.isFinite(n) ? n : 0);
          }}
        />
      </label>
    );
  }

  if (value === null || typeof value === "string") {
    const str = value ?? "";
    return (
      <label className="ed-field">
        <span className="ed-label">{humanize(key)}</span>
        {isMultiline(str) ? (
          <textarea
            className="ed-input ed-textarea"
            value={str}
            rows={Math.min(8, Math.max(2, str.split("\n").length + 1))}
            onChange={(e) => onChange(path, e.target.value)}
          />
        ) : (
          <input
            className="ed-input"
            type="text"
            value={str}
            onChange={(e) => onChange(path, e.target.value)}
          />
        )}
      </label>
    );
  }

  if (Array.isArray(value)) {
    return <ArrayRenderer path={path} value={value} onChange={onChange} onDelete={onDelete} label={key} />;
  }

  if (value && typeof value === "object") {
    return <ObjectRenderer path={path} value={value} onChange={onChange} onDelete={onDelete} label={key} />;
  }

  return null;
}

function ObjectRenderer({ path, value, onChange, onDelete, label, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const keys = Object.keys(value);
  return (
    <div className="ed-group">
      <button type="button" className="ed-group-head" onClick={() => setOpen((o) => !o)}>
        <span className="ed-caret">{open ? "▾" : "▸"}</span>
        <span className="ed-group-label">{humanize(label)}</span>
        <span className="ed-group-meta">{keys.length} {keys.length === 1 ? "field" : "fields"}</span>
      </button>
      {open && (
        <div className="ed-group-body">
          {keys.map((k) => (
            <FieldRenderer
              key={k}
              path={[...path, k]}
              value={value[k]}
              onChange={onChange}
              onDelete={onDelete}
              label={k}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ArrayRenderer({ path, value, onChange, onDelete, label }) {
  const [open, setOpen] = useState(true);
  const allPrimitive = value.every(isPrimitive);

  const addItem = () => {
    if (value.length > 0) {
      onChange(path, [...value, cloneTemplate(value[0])]);
    } else {
      onChange(path, [""]);
    }
  };

  return (
    <div className="ed-group ed-array">
      <button type="button" className="ed-group-head" onClick={() => setOpen((o) => !o)}>
        <span className="ed-caret">{open ? "▾" : "▸"}</span>
        <span className="ed-group-label">{humanize(label)}</span>
        <span className="ed-group-meta">{value.length} {value.length === 1 ? "item" : "items"}</span>
      </button>
      {open && (
        <div className="ed-group-body">
          {value.map((item, i) => (
            <div key={i} className={allPrimitive ? "ed-row" : "ed-item"}>
              {allPrimitive ? (
                <>
                  <FieldRenderer
                    path={[...path, i]}
                    value={item}
                    onChange={onChange}
                    onDelete={onDelete}
                    label={`#${i + 1}`}
                  />
                  <button
                    type="button"
                    className="ed-btn ed-btn-icon"
                    onClick={() => onDelete([...path, i])}
                    aria-label="Remove"
                    title="Remove"
                  >
                    ×
                  </button>
                </>
              ) : (
                <>
                  <div className="ed-item-head">
                    <span className="ed-item-title">{humanize(label)} #{i + 1}</span>
                    <button
                      type="button"
                      className="ed-btn ed-btn-danger"
                      onClick={() => onDelete([...path, i])}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="ed-item-body">
                    {Object.keys(item).map((k) => (
                      <FieldRenderer
                        key={k}
                        path={[...path, i, k]}
                        value={item[k]}
                        onChange={onChange}
                        onDelete={onDelete}
                        label={k}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
          <button type="button" className="ed-btn ed-btn-add" onClick={addItem}>
            + Add {humanize(label).toLowerCase().replace(/s$/, "") || "item"}
          </button>
        </div>
      )}
    </div>
  );
}

export { ObjectRenderer };
