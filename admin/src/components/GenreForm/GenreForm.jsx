import { useEffect, useMemo, useRef, useState } from "react";
import { createGenre, fetchGenres } from "../../services/genreApi";
import { FILTER_GENRE_OPTIONS } from "../../constants/filterGenres";
import ScrollTouch from "../ScrollTouch/ScrollTouch";
import "./GenreForm.css";

function UploadIcon() {
  return (
    <svg className="genre-form__upload-icon" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M19 20H5v-2h14v2zM11 16h2v-6h3l-4-4-4 4h3v6z"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="genre-form__chevron" viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M7 10l5 5 5-5H7z" />
    </svg>
  );
}

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function GenreForm({ onCancel, onSaved }) {
  const fileRef = useRef(null);
  const genrePickerRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [genreIdDropdownOpen, setGenreIdDropdownOpen] = useState(false);
  const [form, setForm] = useState({
    genreId: "",
    titleUz: "",
    titleRu: "",
    filterGenre: "",
    sortOrder: "1",
    img: "",
    imgPreview: "",
  });

  useEffect(() => {
    const loadNextOrder = async () => {
      try {
        const genres = await fetchGenres();
        const maxOrder = genres.reduce((max, item) => Math.max(max, Number(item.sortOrder) || 0), 0);
        setForm((prev) => ({ ...prev, sortOrder: String(maxOrder + 1) }));
      } catch {
        /* ignore silently */
      }
    };
    loadNextOrder();
  }, []);

  useEffect(() => {
    const onOutside = (event) => {
      if (!genrePickerRef.current?.contains(event.target)) {
        setGenreIdDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const canSave = useMemo(() => {
    return (
      form.genreId.trim() &&
      form.titleUz.trim() &&
      form.titleRu.trim() &&
      form.filterGenre.trim() &&
      form.img
    );
  }, [form]);
  const toggleFilterGenre = (genre) => {
    setForm((prev) => ({
      ...prev,
      filterGenre: prev.filterGenre === genre ? "" : genre,
    }));
  };

  const toGenreId = (genreName) =>
    String(genreName || "")
      .toLowerCase()
      .replace(/['`]/g, "")
      .replace(/\s+/g, "-");

  const selectGenreId = (genreName) => {
    patch({ genreId: toGenreId(genreName) });
    setGenreIdDropdownOpen(false);
  };


  const patch = (patchData) => setForm((prev) => ({ ...prev, ...patchData }));

  const onPickFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const imageData = await toDataUrl(file);
    patch({ img: imageData, imgPreview: imageData });
  };

  const onSubmit = async () => {
    if (!canSave) {
      setError("Barcha majburiy maydonlarni to'ldiring.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await createGenre({
        genreId: form.genreId.trim(),
        title: {
          uz: form.titleUz.trim(),
          ru: form.titleRu.trim(),
        },
        img: form.img,
        filterGenre: [form.filterGenre],
        isActive: true,
        sortOrder: Number(form.sortOrder) || 0,
      });
      onSaved?.();
    } catch (e) {
      setError(e.message || "Saqlashda xatolik.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="genre-form">
      <label className="genre-form__label" htmlFor="genre-id">
        Janr ID
      </label>
      <div className="genre-form__picker" ref={genrePickerRef}>
        <button
          id="genre-id"
          type="button"
          className="genre-form__picker-trigger"
          onClick={() => setGenreIdDropdownOpen((v) => !v)}
        >
          <span>{form.genreId || "Janr tanlang"}</span>
          <ChevronIcon />
        </button>
        {genreIdDropdownOpen ? (
          <div className="genre-form__picker-dropdown">
            {FILTER_GENRE_OPTIONS.map((genreName) => (
              <button
                key={genreName}
                type="button"
                className="genre-form__picker-item"
                onClick={() => selectGenreId(genreName)}
              >
                {genreName}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <label className="genre-form__label" htmlFor="genre-title-uz">
        Nomi (UZ)
      </label>
      <input
        id="genre-title-uz"
        className="genre-form__input"
        type="text"
        placeholder="Drama"
        value={form.titleUz}
        onChange={(e) => patch({ titleUz: e.target.value })}
      />

      <label className="genre-form__label" htmlFor="genre-title-ru">
        Nomi (RU)
      </label>
      <input
        id="genre-title-ru"
        className="genre-form__input"
        type="text"
        placeholder="Драма"
        value={form.titleRu}
        onChange={(e) => patch({ titleRu: e.target.value })}
      />

      <label className="genre-form__label" htmlFor="genre-filter">
        Filter janrlar (tanlang)
      </label>
      <ScrollTouch id="genre-filter" className="genre-form__options" allowInteractiveDrag>
        {FILTER_GENRE_OPTIONS.map((genre) => {
          const selected = form.filterGenre === genre;
          return (
            <button
              key={genre}
              type="button"
              className={`genre-form__option${selected ? " is-selected" : ""}`}
              onClick={() => toggleFilterGenre(genre)}
            >
              {genre}
            </button>
          );
        })}
      </ScrollTouch>

      <label className="genre-form__label">Janr rasmi</label>
      <button
        type="button"
        className="genre-form__upload"
        onClick={() => fileRef.current?.click()}
      >
        {form.imgPreview ? (
          <img className="genre-form__preview" src={form.imgPreview} alt="Genre preview" />
        ) : (
          <div className="genre-form__upload-inner">
            <UploadIcon />
            <span>Rasm yuklash</span>
            <small>JPG, PNG, WEBP</small>
          </div>
        )}
      </button>
      <input
        ref={fileRef}
        className="genre-form__file-input"
        type="file"
        accept="image/*"
        onChange={onPickFile}
      />

      <label className="genre-form__label" htmlFor="genre-sort-order">
        Tartib raqami
      </label>
      <input
        id="genre-sort-order"
        className="genre-form__input"
        type="number"
        min="1"
        value={form.sortOrder}
        onChange={(e) => patch({ sortOrder: e.target.value })}
      />

      {error ? <p className="genre-form__error">{error}</p> : null}

      <div className="genre-form__actions">
        <button type="button" className="genre-form__cancel-btn" onClick={onCancel}>
          Bekor qilish
        </button>
        <button
          type="button"
          className="genre-form__save-btn"
          onClick={onSubmit}
          disabled={saving}
        >
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </button>
      </div>
    </div>
  );
}
