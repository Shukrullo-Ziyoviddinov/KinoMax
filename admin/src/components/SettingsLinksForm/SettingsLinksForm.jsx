import { useEffect, useMemo, useState } from "react";
import { fetchSocialLinks, saveSocialLinks } from "../../services/socialLinksApi";
import "./SettingsLinksForm.css";

const TYPE_MAP = {
  social: "social",
  "app-links": "appStore",
  contact: "contact",
};

function toRows(group = {}) {
  return Object.entries(group).map(([key, value], idx) => ({
    key,
    label: value?.label || "",
    link: value?.link || "",
    icon: value?.icon || "",
    address: value?.address || "",
    sortOrder: idx + 1,
    isActive: true,
  }));
}

function emptyRow() {
  return {
    key: "",
    label: "",
    link: "",
    icon: "",
    address: "",
    sortOrder: 0,
    isActive: true,
  };
}

export default function SettingsLinksForm({ section, onCancel, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  const apiType = TYPE_MAP[section];
  const title = useMemo(() => {
    if (section === "social") return "Ijtimoiy tarmoqlar";
    if (section === "app-links") return "Ilova havolalari";
    return "Aloqa";
  }, [section]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchSocialLinks();
        setRows(toRows(data?.[apiType]));
      } catch (e) {
        setError(e.message || "Ma'lumotlarni olishda xatolik.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [apiType]);

  const patchRow = (index, patch) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addRow = () => setRows((prev) => [...prev, { ...emptyRow(), sortOrder: prev.length + 1 }]);
  const removeRow = (index) => setRows((prev) => prev.filter((_, i) => i !== index));

  const onSubmit = async () => {
    const filtered = rows
      .map((row, idx) => ({
        ...row,
        key: String(row.key || "").trim(),
        sortOrder: Number(row.sortOrder) || idx + 1,
      }))
      .filter((row) => row.key);

    if (!filtered.length) {
      setError("Kamida bitta key kiriting.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await saveSocialLinks(apiType, filtered);
      onSaved?.();
    } catch (e) {
      setError(e.message || "Saqlashda xatolik.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-links-form">
      <p className="settings-links-form__hint">{title} - oldingi linklar va yangi qo'shish</p>
      {loading ? (
        <p className="settings-links-form__hint">Yuklanmoqda...</p>
      ) : (
        <div className="settings-links-form__list">
          {rows.map((row, index) => (
            <div className="settings-links-form__card" key={`${row.key || "new"}-${index}`}>
              <div className="settings-links-form__grid">
                <label className="settings-links-form__label">Key</label>
                <input className="settings-links-form__input" value={row.key} onChange={(e) => patchRow(index, { key: e.target.value })} />
                <label className="settings-links-form__label">Label</label>
                <input className="settings-links-form__input" value={row.label} onChange={(e) => patchRow(index, { label: e.target.value })} />
                <label className="settings-links-form__label">Link</label>
                <input className="settings-links-form__input" value={row.link} onChange={(e) => patchRow(index, { link: e.target.value })} />
                <label className="settings-links-form__label">Icon</label>
                <input className="settings-links-form__input" value={row.icon} onChange={(e) => patchRow(index, { icon: e.target.value })} />
                <label className="settings-links-form__label">Address</label>
                <input className="settings-links-form__input" value={row.address} onChange={(e) => patchRow(index, { address: e.target.value })} />
                <label className="settings-links-form__label">Sort</label>
                <input className="settings-links-form__input" type="number" value={row.sortOrder} onChange={(e) => patchRow(index, { sortOrder: e.target.value })} />
              </div>
              <button type="button" className="settings-links-form__remove-btn" onClick={() => removeRow(index)}>
                O'chirish
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" className="settings-links-form__add-btn" onClick={addRow}>
        + Yana qo'shish
      </button>

      {error ? <p className="settings-links-form__error">{error}</p> : null}

      <div className="settings-links-form__actions">
        <button type="button" className="settings-links-form__cancel-btn" onClick={onCancel}>
          Bekor qilish
        </button>
        <button type="button" className="settings-links-form__save-btn" onClick={onSubmit} disabled={saving || loading}>
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </button>
      </div>
    </div>
  );
}
