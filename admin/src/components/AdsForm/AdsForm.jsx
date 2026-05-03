import { useEffect, useMemo, useRef, useState } from "react";
import { createAd, fetchAds } from "../../services/adsApi";
import UploadProgress from "../UploadProgress/UploadProgress";
import "./AdsForm.css";

function UploadIcon() {
  return (
    <svg className="ads-form__upload-icon" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M19 20H5v-2h14v2zM11 16h2v-6h3l-4-4-4 4h3v6z"
      />
    </svg>
  );
}

function toDataUrl(file, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress?.(percent);
    };
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdsForm({ onCancel, onSaved, mode = "create", initialData = null, onSubmitData }) {
  const fileRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    videoUrl: "",
    sortOrder: "1",
    isActive: true,
  });

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setForm((prev) => ({
        ...prev,
        videoUrl: initialData.videoUrl || "",
        sortOrder: String(initialData.sortOrder || 1),
        isActive: initialData.isActive !== false,
      }));
      return;
    }

    const loadNextOrder = async () => {
      try {
        const ads = await fetchAds();
        const maxOrder = ads.reduce((max, item) => Math.max(max, Number(item.sortOrder) || 0), 0);
        setForm((prev) => ({ ...prev, sortOrder: String(maxOrder + 1) }));
      } catch {
        /* ignore */
      }
    };
    loadNextOrder();
  }, [mode, initialData]);

  const canSave = useMemo(() => form.videoUrl && form.sortOrder, [form.videoUrl, form.sortOrder]);

  const patch = (patchData) => setForm((prev) => ({ ...prev, ...patchData }));

  const onPickVideo = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name || "");
    setError("");
    setUploading(true);
    setUploadProgress(1);
    try {
      const videoData = await toDataUrl(file, setUploadProgress);
      patch({ videoUrl: videoData });
      setUploadProgress(100);
    } catch (e) {
      setError("Video yuklashda xatolik.");
      patch({ videoUrl: "" });
      setUploadProgress(0);
    } finally {
      setUploading(false);
      // Bir xil fayl qayta tanlanganda ham onChange ishlashi uchun
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const onSubmit = async () => {
    if (!canSave) {
      setError("Video va tartib raqami majburiy.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const payload = {
        videoUrl: form.videoUrl,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 1,
      };
      if (mode === "edit" && onSubmitData) {
        await onSubmitData(payload);
      } else {
        await createAd(payload);
      }
      onSaved?.();
    } catch (e) {
      setError(e.message || "Saqlashda xatolik.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ads-form">
      <label className="ads-form__label">Reklama video</label>
      <button type="button" className="ads-form__upload" onClick={() => fileRef.current?.click()}>
        <div className="ads-form__upload-inner">
          <UploadIcon />
          <span>
            {uploading
              ? `Video yuklanmoqda... ${uploadProgress}%`
              : form.videoUrl
              ? "Video tanlandi"
              : "Video yuklash"}
          </span>
          {selectedFileName ? <small className="ads-form__file-name">{selectedFileName}</small> : null}
          <small>MP4, WEBM</small>
          <UploadProgress show={uploading || uploadProgress > 0} progress={uploadProgress} />
        </div>
      </button>
      <input
        ref={fileRef}
        className="ads-form__file-input"
        type="file"
        accept="video/*"
        onChange={onPickVideo}
      />

      <label className="ads-form__label" htmlFor="ads-sort-order">
        Tartib raqami
      </label>
      <input
        id="ads-sort-order"
        className="ads-form__input"
        type="number"
        min="1"
        value={form.sortOrder}
        onChange={(e) => patch({ sortOrder: e.target.value })}
      />

      <label className="ads-form__switch">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => patch({ isActive: e.target.checked })}
        />
        <span>Faol</span>
      </label>

      {error ? <p className="ads-form__error">{error}</p> : null}

      <div className="ads-form__actions">
        <button type="button" className="ads-form__cancel-btn" onClick={onCancel}>
          Bekor qilish
        </button>
        <button type="button" className="ads-form__save-btn" onClick={onSubmit} disabled={saving}>
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </button>
      </div>
    </div>
  );
}
