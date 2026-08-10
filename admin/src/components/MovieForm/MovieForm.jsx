import { useEffect, useMemo, useRef, useState } from "react";
import { createMovie, fetchActorsForMovie } from "../../services/movieApi";
import { uploadToR2, UPLOAD_FOLDERS } from "../../services/uploadApi";
import {
  CATEGORY_NAME_OPTIONS,
  CATEGORY_NAME_TO_SECTION,
  CATEGORY_OPTIONS,
  FILTER_GENRE_OPTIONS,
  isAnonsCategory,
  TYPE_CATEGORY_OPTIONS,
} from "../../constants/movieFormOptions";
import { getVideoEmbed } from "../../utils/videoEmbed";
import UploadProgress from "../UploadProgress/UploadProgress";
import "./MovieForm.css";

function UploadIcon() {
  return (
    <svg className="movie-form__upload-icon" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M19 20H5v-2h14v2zM11 16h2v-6h3l-4-4-4 4h3v6zm-6-5h2v2H5v-2zm12 0h2v2h-2v-2z"
      />
    </svg>
  );
}

const emptySeason = (seasonNumber = 1) => ({
  seasonNumber,
  title: { uz: `Mavsum ${seasonNumber}`, ru: `Сезон ${seasonNumber}` },
  episodes: [{ uz: "", ru: "" }],
});

function normalizeInitialMovie(data = {}) {
  const safeSeasons = Array.isArray(data.seasons) && data.seasons.length
    ? data.seasons.map((season, idx) => ({
        seasonNumber: Number(season?.seasonNumber) || idx + 1,
        title: {
          uz: season?.title?.uz || `Mavsum ${idx + 1}`,
          ru: season?.title?.ru || `Сезон ${idx + 1}`,
        },
        episodes: Array.isArray(season?.episodes) && season.episodes.length
          ? season.episodes.map((ep) => ({ uz: ep?.uz || "", ru: ep?.ru || "" }))
          : [{ uz: "", ru: "" }],
      }))
    : [emptySeason(1)];

  const safeDescription = typeof data.description === "object" && data.description
    ? data.description
    : {};

  return {
    ...data,
    movieId: String(data.movieId ?? data.id ?? ""),
    movieCode: String(data.movieCode ?? ""),
    title: {
      uz: data?.title?.uz || "",
      ru: data?.title?.ru || "",
    },
    titleImg: {
      uz: data?.titleImg?.uz || "",
      ru: data?.titleImg?.ru || "",
    },
    homeImg: {
      uz: data?.homeImg?.uz || "",
      ru: data?.homeImg?.ru || "",
    },
    movieMedia: {
      uz: {
        img: {
          type: "img",
          src: data?.movieMedia?.uz?.img?.src || data?.movieMedia?.uz?.video?.src || "",
        },
      },
      ru: {
        img: {
          type: "img",
          src: data?.movieMedia?.ru?.img?.src || data?.movieMedia?.ru?.video?.src || "",
        },
      },
    },
    description: {
      uz: {
        text: safeDescription?.uz?.text || "",
        year: safeDescription?.uz?.year ?? "",
        country: safeDescription?.uz?.country || "",
        duration: safeDescription?.uz?.duration ?? "",
        genre: Array.isArray(safeDescription?.uz?.genre) ? safeDescription.uz.genre : [],
        director: safeDescription?.uz?.director || "",
      },
      ru: {
        text: safeDescription?.ru?.text || "",
        year: safeDescription?.ru?.year ?? "",
        country: safeDescription?.ru?.country || "",
        duration: safeDescription?.ru?.duration ?? "",
        genre: Array.isArray(safeDescription?.ru?.genre) ? safeDescription.ru.genre : [],
        director: safeDescription?.ru?.director || "",
      },
    },
    watchVideo: {
      uz: data?.watchVideo?.uz || "",
      ru: data?.watchVideo?.ru || "",
    },
    seasons: safeSeasons,
    actors: Array.isArray(data.actors) ? data.actors.map((v) => Number(v)).filter(Number.isFinite) : [],
    typeCategory: Array.isArray(data.typeCategory) ? data.typeCategory : [],
    filterGenre: Array.isArray(data.filterGenre) ? data.filterGenre : [],
    filterCountry: data?.filterCountry || "",
    like: String(data?.like ?? ""),
    dislike: String(data?.dislike ?? ""),
    specs: {
      duration: data?.specs?.duration ?? "",
      ageRating: data?.specs?.ageRating || "",
      year: data?.specs?.year ?? "",
      countries: Array.isArray(data?.specs?.countries) ? data.specs.countries : [],
      languages: Array.isArray(data?.specs?.languages) ? data.specs.languages : [],
    },
    categoryName: data?.categoryName || "",
    category: data?.category || "",
  };
}

export default function MovieForm({ onCancel, onSaved, mode = "create", initialData = null, onSubmitData }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [actors, setActors] = useState([]);
  const [actorsOpen, setActorsOpen] = useState(false);
  const [filterGenreOpen, setFilterGenreOpen] = useState(false);
  const [typeCategoryOpen, setTypeCategoryOpen] = useState(false);
  const [categoryNameOpen, setCategoryNameOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [uploadState, setUploadState] = useState({});
  const [form, setForm] = useState({
    movieId: "",
    movieCode: "",
    title: { uz: "", ru: "" },
    titleImg: { uz: "", ru: "" },
    homeImg: { uz: "", ru: "" },
    movieMedia: {
      uz: { img: { type: "img", src: "" } },
      ru: { img: { type: "img", src: "" } },
    },
    ratingImdb: "",
    ratingKinopoisk: "",
    ratingNetflix: "",
    ageRestriction: "",
    categoryName: "",
    category: "",
    genre: { uz: [], ru: [] },
    description: {
      uz: { text: "", year: "", country: "", duration: "", genre: [], director: "" },
      ru: { text: "", year: "", country: "", duration: "", genre: [], director: "" },
    },
    watchVideo: { uz: "", ru: "" },
    seasons: [emptySeason(1)],
    actors: [],
    typeCategory: [],
    filterCountry: "",
    filterGenre: [],
    like: "",
    dislike: "",
    specs: { duration: "", ageRating: "", year: "", countries: [], languages: [] },
    isActive: true,
  });

  const wrappersRef = useRef(null);

  useEffect(() => {
    const run = async () => {
      try {
        const actorRows = await fetchActorsForMovie();
        if (mode === "edit" && initialData) {
          setForm((prev) => ({ ...prev, ...normalizeInitialMovie(initialData) }));
        }
        setActors(actorRows);
      } catch (e) {
        setError(e.message || "Boshlang'ich ma'lumotlarni olishda xatolik.");
      }
    };
    run();
  }, [mode, initialData]);

  useEffect(() => {
    const onOutside = (event) => {
      if (!wrappersRef.current?.contains(event.target)) {
        setActorsOpen(false);
        setFilterGenreOpen(false);
        setTypeCategoryOpen(false);
        setCategoryNameOpen(false);
        setCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const isAnons = isAnonsCategory(form.categoryName, form.category);

  const isUploading = useMemo(
    () => Object.values(uploadState).some((item) => item?.uploading),
    [uploadState]
  );

  const canSave = useMemo(() => {
    return Boolean(
      form.title.uz.trim() &&
        form.title.ru.trim() &&
        form.homeImg.uz &&
        form.homeImg.ru &&
        form.category &&
        form.categoryName
    );
  }, [form]);

  const selectCategoryName = (value) => {
    patch({ categoryName: value, category: value });
    setCategoryNameOpen(false);
  };

  const selectCategory = (value) => {
    patch({ category: value, categoryName: value });
    setCategoryOpen(false);
  };

  const buildTypeCategoryForSection = (section, previous = []) => {
    const next = (Array.isArray(previous) ? previous : [])
      .filter((item) => item && item !== "anonslar" && item !== "anons" && item !== section);
    if (section) next.push(section);
    if (section === "koreaDrama" && !next.includes("korea")) next.push("korea");
    return next;
  };

  const setUpload = (key, patch) => {
    setUploadState((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), ...patch } }));
  };

  const patch = (patchData) => setForm((prev) => ({ ...prev, ...patchData }));

  const onPickFile = async (key, pathUpdater, file) => {
    if (!file) return;
    setError("");
    setUpload(key, { uploading: true, progress: 1, fileName: file.name || "" });
    try {
      const { url } = await uploadToR2(file, UPLOAD_FOLDERS.movies, {
        onProgress: (progress) => setUpload(key, { progress }),
      });
      setForm((prev) => pathUpdater(prev, url));
      setUpload(key, { uploading: false, progress: 100 });
    } catch (e) {
      setUpload(key, { uploading: false, progress: 0 });
      setError(e.message || "Faylni R2 ga yuklashda xatolik.");
    }
  };

  const toggleArrayValue = (key, value) => {
    patch({
      [key]: form[key].includes(value) ? form[key].filter((x) => x !== value) : [...form[key], value],
    });
  };

  const toggleActor = (id) => {
    const numeric = Number(id);
    patch({
      actors: form.actors.includes(numeric)
        ? form.actors.filter((item) => item !== numeric)
        : [...form.actors, numeric],
    });
  };

  const updateSeason = (index, updater) => {
    const next = [...form.seasons];
    next[index] = updater(next[index]);
    patch({ seasons: next });
  };

  const toNumberOrDefault = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const normalizeCommaText = (text) =>
    String(text || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

  const genresUzText = form.description?.uz?.genre?.join(", ") || "";
  const genresRuText = form.description?.ru?.genre?.join(", ") || "";

  const renderUploadField = ({ keyName, label, accept, onFile }) => {
    const upload = uploadState[keyName] || {};
    const selectedText = upload.fileName
      ? upload.fileName
      : upload.progress >= 100
      ? "Fayl tanlandi"
      : "Fayl tanlanmagan";
    const isVideo = accept.includes("video");

    return (
      <div className="movie-form__upload-row" key={keyName}>
        <label className="movie-form__label">{label}</label>
        <label className="movie-form__upload-field">
          <input
            className="movie-form__file-input"
            type="file"
            accept={accept}
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <div className="movie-form__upload-head">
            <UploadIcon />
            <div className="movie-form__upload-meta">
              <strong>{isVideo ? "Video yuklash" : "Rasm yuklash"}</strong>
              <span>{selectedText}</span>
            </div>
          </div>
          <UploadProgress show={upload.uploading || upload.progress > 0} progress={upload.progress} />
        </label>
      </div>
    );
  };

  const onSubmit = async () => {
    if (!canSave) {
      setError("Title, Home Img, Category va Category Name majburiy.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const categoryName = form.categoryName || form.category || "";
      const section = CATEGORY_NAME_TO_SECTION[categoryName] || "";
      // Anons uchun watchVideo bo'sh bo'lishi mumkin; boshqa bo'limga o'tkazganda
      // video qo'shilgan bo'lsa saqlanadi, eski ma'lumotlar o'chirilmaydi.
      const watchVideo = {
        uz: form.watchVideo?.uz || "",
        ru: form.watchVideo?.ru || "",
      };

      const payload = {
        movieCode: form.movieCode === "" ? undefined : toNumberOrDefault(form.movieCode, 0),
        title: form.title,
        titleImg: form.titleImg,
        homeImg: form.homeImg,
        movieMedia: form.movieMedia,
        ratingImdb: form.ratingImdb === "" ? 0 : Number(form.ratingImdb),
        ratingKinopoisk: form.ratingKinopoisk === "" ? 0 : Number(form.ratingKinopoisk),
        ratingNetflix: form.ratingNetflix === "" ? 0 : Number(form.ratingNetflix),
        ageRestriction: toNumberOrDefault(form.ageRestriction, 0),
        categoryName,
        category: categoryName,
        genre: form.genre,
        description: form.description,
        watchVideo,
        seasons: form.seasons,
        actors: form.actors,
        typeCategory: buildTypeCategoryForSection(section, form.typeCategory),
        filterCountry: form.filterCountry,
        filterGenre: form.filterGenre,
        like: String(form.like || ""),
        dislike: String(form.dislike || ""),
        specs: {
          duration: toNumberOrDefault(form.specs.duration, 0),
          ageRating: String(form.specs.ageRating || ""),
          year: toNumberOrDefault(form.specs.year, 0),
          countries: form.specs.countries,
          languages: form.specs.languages,
        },
        isActive: Boolean(form.isActive),
      };
      if (mode === "edit" && onSubmitData) {
        await onSubmitData({
          ...payload,
          // Editda ID o'zgarmaydi — faqat URL bo'yicha yangilanadi
          id: toNumberOrDefault(form.movieId, 0),
          movieId: toNumberOrDefault(form.movieId, 0),
        });
      } else {
        await createMovie(payload);
      }
      onSaved?.();
    } catch (e) {
      setError(e.message || "Saqlashda xatolik.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="movie-form" ref={wrappersRef}>
      <div className="movie-form__section-card movie-form__section-card--compact">
      <div className="movie-form__grid">
        {mode === "edit" && form.movieId ? (
          <>
            <label className="movie-form__label">Movie ID</label>
            <input className="movie-form__input" value={form.movieId} readOnly disabled />
          </>
        ) : null}
        <label className="movie-form__label">Movie Code (ixtiyoriy)</label>
        <input className="movie-form__input" type="number" value={form.movieCode} onChange={(e) => patch({ movieCode: e.target.value })} />

        <label className="movie-form__label">Title UZ</label>
        <input className="movie-form__input" value={form.title.uz} onChange={(e) => patch({ title: { ...form.title, uz: e.target.value } })} />
        <label className="movie-form__label">Title RU</label>
        <input className="movie-form__input" value={form.title.ru} onChange={(e) => patch({ title: { ...form.title, ru: e.target.value } })} />
      </div>
      </div>

      <h4 className="movie-form__section">Rasmlar</h4>
      <div className="movie-form__section-card movie-form__upload-grid">
      {["titleImg.uz", "titleImg.ru", "homeImg.uz", "homeImg.ru"].map((key) => {
        const [root, lang] = key.split(".");
        return renderUploadField({
          keyName: key,
          label: key,
          accept: "image/*",
          onFile: (file) =>
            onPickFile(key, (prev, data) => ({ ...prev, [root]: { ...prev[root], [lang]: data } }), file),
        });
      })}
      </div>

      <h4 className="movie-form__section">Detail rasm (movieMedia)</h4>
      <div className="movie-form__section-card movie-form__upload-grid">
      {["movieMedia.uz", "movieMedia.ru"].map((key) => {
        return renderUploadField({
          keyName: key,
          label: key,
          accept: "image/*",
          onFile: (file) =>
            onPickFile(
              key,
              (prev, data) => {
                const lang = key.endsWith(".uz") ? "uz" : "ru";
                return {
                  ...prev,
                  movieMedia: {
                    ...prev.movieMedia,
                    [lang]: { img: { type: "img", src: data } },
                  },
                };
              },
              file
            ),
        });
      })}
      </div>

      <h4 className="movie-form__section">
        Tomosha videolari
        {isAnons ? (
          <span className="movie-form__optional-hint"> (ixtiyoriy — anons)</span>
        ) : null}
      </h4>
      <div className="movie-form__section-card movie-form__upload-grid">
      {isAnons && (
        <p className="movie-form__hint">
          Anons bo‘limida video majburiy emas. Keyinroq video qo‘shib boshqa
          bo‘limga o‘tkazsangiz, kino anonsdan chiqib yangi bo‘limga tushadi.
        </p>
      )}
      <p className="movie-form__hint">
        Har til uchun bitta qiymat (`watchVideo.uz` / `watchVideo.ru`): Mover/YouTube
        URL yozing <strong>yoki</strong> qurilmadan R2 ga yuklang. Ikkalasi birga
        emas — oxirgi kiritilgan qiymat saqlanadi.
      </p>
      {["uz", "ru"].map((lang) => {
        const keyName = `watchVideo.${lang}`;
        const label = isAnons ? `watchVideo.${lang} (ixtiyoriy)` : `watchVideo.${lang}`;
        const videoRaw = String(form.watchVideo?.[lang] || "").trim();
        const embed = getVideoEmbed(videoRaw);
        const embedUrl = embed?.embedUrl || "";
        const isDirectVideo =
          !embedUrl &&
          Boolean(videoRaw) &&
          (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(videoRaw) ||
            videoRaw.includes("/movies/") ||
            videoRaw.startsWith("http://") ||
            videoRaw.startsWith("https://") ||
            videoRaw.startsWith("data:video") ||
            videoRaw.startsWith("blob:"));

        return (
          <div className="movie-form__video-dual" key={keyName}>
            <label className="movie-form__label" htmlFor={`watch-video-url-${lang}`}>
              {label} — URL (Mover / YouTube)
            </label>
            <input
              id={`watch-video-url-${lang}`}
              className="movie-form__input"
              type="url"
              placeholder="https://mover.uz/watch/... yoki https://youtu.be/..."
              value={form.watchVideo?.[lang] || ""}
              onChange={(e) => {
                setUpload(keyName, { uploading: false, progress: 0, fileName: "" });
                patch({
                  watchVideo: {
                    ...form.watchVideo,
                    [lang]: e.target.value,
                  },
                });
              }}
            />

            <div className="movie-form__preview-box">
              {embedUrl ? (
                <iframe
                  key={embedUrl}
                  className="movie-form__video-preview movie-form__video-preview--embed"
                  src={embedUrl}
                  title={`Video preview ${lang}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : isDirectVideo ? (
                <video
                  key={videoRaw}
                  className="movie-form__video-preview"
                  src={videoRaw}
                  controls
                  playsInline
                  preload="metadata"
                />
              ) : (
                <span className="movie-form__preview-empty">
                  Mover/YouTube URL yoki R2 video — preview shu yerda
                </span>
              )}
            </div>

            <p className="movie-form__video-or">yoki R2 ga video yuklash</p>

            {renderUploadField({
              keyName,
              label: `${keyName} — R2 fayl`,
              accept: "video/*",
              onFile: (file) =>
                onPickFile(
                  keyName,
                  (prev, data) => ({
                    ...prev,
                    watchVideo: { ...prev.watchVideo, [lang]: data },
                  }),
                  file
                ),
            })}
          </div>
        );
      })}
      </div>

      <h4 className="movie-form__section">Description (UZ/RU)</h4>
      <div className="movie-form__section-card">
      <div className="movie-form__grid">
        <label className="movie-form__label">Director UZ</label>
        <input className="movie-form__input" value={form.description.uz.director} onChange={(e) => patch({ description: { ...form.description, uz: { ...form.description.uz, director: e.target.value } } })} />
        <label className="movie-form__label">Director RU</label>
        <input className="movie-form__input" value={form.description.ru.director} onChange={(e) => patch({ description: { ...form.description, ru: { ...form.description.ru, director: e.target.value } } })} />
        <label className="movie-form__label">Text UZ</label>
        <textarea className="movie-form__textarea" value={form.description.uz.text} onChange={(e) => patch({ description: { ...form.description, uz: { ...form.description.uz, text: e.target.value } } })} />
        <label className="movie-form__label">Text RU</label>
        <textarea className="movie-form__textarea" value={form.description.ru.text} onChange={(e) => patch({ description: { ...form.description, ru: { ...form.description.ru, text: e.target.value } } })} />
        <label className="movie-form__label">Year UZ</label>
        <input className="movie-form__input" type="number" value={form.description.uz.year} onChange={(e) => patch({ description: { ...form.description, uz: { ...form.description.uz, year: toNumberOrDefault(e.target.value, "") } } })} />
        <label className="movie-form__label">Year RU</label>
        <input className="movie-form__input" type="number" value={form.description.ru.year} onChange={(e) => patch({ description: { ...form.description, ru: { ...form.description.ru, year: toNumberOrDefault(e.target.value, "") } } })} />
        <label className="movie-form__label">Country UZ</label>
        <input className="movie-form__input" value={form.description.uz.country} onChange={(e) => patch({ description: { ...form.description, uz: { ...form.description.uz, country: e.target.value } } })} />
        <label className="movie-form__label">Country RU</label>
        <input className="movie-form__input" value={form.description.ru.country} onChange={(e) => patch({ description: { ...form.description, ru: { ...form.description.ru, country: e.target.value } } })} />
        <label className="movie-form__label">Duration UZ</label>
        <input className="movie-form__input" type="number" value={form.description.uz.duration} onChange={(e) => patch({ description: { ...form.description, uz: { ...form.description.uz, duration: toNumberOrDefault(e.target.value, "") } } })} />
        <label className="movie-form__label">Duration RU</label>
        <input className="movie-form__input" type="number" value={form.description.ru.duration} onChange={(e) => patch({ description: { ...form.description, ru: { ...form.description.ru, duration: toNumberOrDefault(e.target.value, "") } } })} />
        <label className="movie-form__label">Genre UZ (vergul bilan)</label>
        <input
          className="movie-form__input"
          value={genresUzText}
          onChange={(e) =>
            patch({
              description: {
                ...form.description,
                uz: { ...form.description.uz, genre: normalizeCommaText(e.target.value) },
              },
            })
          }
        />
        <label className="movie-form__label">Genre RU (vergul bilan)</label>
        <input
          className="movie-form__input"
          value={genresRuText}
          onChange={(e) =>
            patch({
              description: {
                ...form.description,
                ru: { ...form.description.ru, genre: normalizeCommaText(e.target.value) },
              },
            })
          }
        />
      </div>
      </div>

      <h4 className="movie-form__section">Seasons</h4>
      {form.seasons.map((season, seasonIndex) => (
        <div className="movie-form__box" key={`season-${seasonIndex}`}>
          <div className="movie-form__box-head">
            <strong>Mavsum {season.seasonNumber}</strong>
            <button type="button" className="movie-form__mini-btn" onClick={() => patch({ seasons: form.seasons.filter((_, i) => i !== seasonIndex) })} disabled={form.seasons.length === 1}>
              O'chirish
            </button>
          </div>
          <div className="movie-form__grid">
            <label className="movie-form__label">seasonNumber</label>
            <input className="movie-form__input" type="number" value={season.seasonNumber} onChange={(e) => updateSeason(seasonIndex, (prev) => ({ ...prev, seasonNumber: toNumberOrDefault(e.target.value, 1) }))} />
            <label className="movie-form__label">Title UZ</label>
            <input className="movie-form__input" value={season.title.uz} onChange={(e) => updateSeason(seasonIndex, (prev) => ({ ...prev, title: { ...prev.title, uz: e.target.value } }))} />
            <label className="movie-form__label">Title RU</label>
            <input className="movie-form__input" value={season.title.ru} onChange={(e) => updateSeason(seasonIndex, (prev) => ({ ...prev, title: { ...prev.title, ru: e.target.value } }))} />
          </div>
          {season.episodes.map((ep, epIndex) => (
            <div className="movie-form__box movie-form__box--inner" key={`ep-${seasonIndex}-${epIndex}`}>
              <div className="movie-form__box-head">
                <strong>Episode {epIndex + 1}</strong>
                <button type="button" className="movie-form__mini-btn" onClick={() => updateSeason(seasonIndex, (prev) => ({ ...prev, episodes: prev.episodes.filter((_, i) => i !== epIndex) }))} disabled={season.episodes.length === 1}>
                  O'chirish
                </button>
              </div>
              {["uz", "ru"].map((lang) => {
                const key = `season-${seasonIndex}-ep-${epIndex}-${lang}`;
                return renderUploadField({
                  keyName: key,
                  label: `Episode video ${lang.toUpperCase()}`,
                  accept: "video/*",
                  onFile: (file) =>
                    onPickFile(
                      key,
                      (prev, data) => {
                        const seasons = [...prev.seasons];
                        const episodes = [...seasons[seasonIndex].episodes];
                        episodes[epIndex] = { ...episodes[epIndex], [lang]: data };
                        seasons[seasonIndex] = { ...seasons[seasonIndex], episodes };
                        return { ...prev, seasons };
                      },
                      file
                    ),
                });
              })}
            </div>
          ))}
          <button type="button" className="movie-form__mini-btn" onClick={() => updateSeason(seasonIndex, (prev) => ({ ...prev, episodes: [...prev.episodes, { uz: "", ru: "" }] }))}>
            + Episode qo'shish
          </button>
        </div>
      ))}
      <button type="button" className="movie-form__add-btn" onClick={() => patch({ seasons: [...form.seasons, emptySeason(form.seasons.length + 1)] })}>
        + Mavsum qo'shish
      </button>

      <h4 className="movie-form__section">Tanlov maydonlari</h4>
      <div className="movie-form__section-card">
      <div className="movie-form__grid">
        <label className="movie-form__label">categoryName</label>
        <div className="movie-form__dropdown">
          <button
            type="button"
            className="movie-form__dropdown-trigger"
            onClick={() => setCategoryNameOpen((v) => !v)}
          >
            {form.categoryName || "Tanlang"}
          </button>
          {categoryNameOpen && (
            <div className="movie-form__dropdown-menu">
              {CATEGORY_NAME_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`movie-form__option-btn${form.categoryName === item ? " is-active" : ""}`}
                  onClick={() => selectCategoryName(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
        <label className="movie-form__label">category</label>
        <div className="movie-form__dropdown">
          <button
            type="button"
            className="movie-form__dropdown-trigger"
            onClick={() => setCategoryOpen((v) => !v)}
          >
            {form.category || "Tanlang"}
          </button>
          {categoryOpen && (
            <div className="movie-form__dropdown-menu">
              {CATEGORY_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`movie-form__option-btn${form.category === item ? " is-active" : ""}`}
                  onClick={() => selectCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
        <label className="movie-form__label">filterCountry</label>
        <input className="movie-form__input" value={form.filterCountry} onChange={(e) => patch({ filterCountry: e.target.value })} />
      </div>
      </div>

      <div className="movie-form__dropdown">
        <button type="button" className="movie-form__dropdown-trigger" onClick={() => setActorsOpen((v) => !v)}>
          Aktyorlar ({form.actors.length})
        </button>
        {actorsOpen && (
          <div className="movie-form__dropdown-menu">
            {actors.map((actor) => {
              const actorId = Number(actor.actorId || actor.id);
              const name = actor?.name?.uz || actor?.name?.ru || `Actor ${actorId}`;
              return (
                <label key={actorId} className="movie-form__check">
                  <input type="checkbox" checked={form.actors.includes(actorId)} onChange={() => toggleActor(actorId)} />
                  <span>{name}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="movie-form__dropdown">
        <button type="button" className="movie-form__dropdown-trigger" onClick={() => setFilterGenreOpen((v) => !v)}>
          filterGenre ({form.filterGenre.length})
        </button>
        {filterGenreOpen && (
          <div className="movie-form__dropdown-menu">
            {FILTER_GENRE_OPTIONS.map((item) => (
              <label key={item} className="movie-form__check">
                <input type="checkbox" checked={form.filterGenre.includes(item)} onChange={() => toggleArrayValue("filterGenre", item)} />
                <span>{item}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="movie-form__dropdown">
        <button type="button" className="movie-form__dropdown-trigger" onClick={() => setTypeCategoryOpen((v) => !v)}>
          typeCategory ({form.typeCategory.length})
        </button>
        {typeCategoryOpen && (
          <div className="movie-form__dropdown-menu">
            {TYPE_CATEGORY_OPTIONS.map((item) => (
              <label key={item} className="movie-form__check">
                <input type="checkbox" checked={form.typeCategory.includes(item)} onChange={() => toggleArrayValue("typeCategory", item)} />
                <span>{item}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <h4 className="movie-form__section">Rating / Specs</h4>
      <div className="movie-form__section-card">
      <div className="movie-form__grid">
        <label className="movie-form__label">ratingImdb</label>
        <input className="movie-form__input" type="number" step="0.1" value={form.ratingImdb} onChange={(e) => patch({ ratingImdb: e.target.value })} />
        <label className="movie-form__label">ratingKinopoisk</label>
        <input className="movie-form__input" type="number" step="0.1" value={form.ratingKinopoisk} onChange={(e) => patch({ ratingKinopoisk: e.target.value })} />
        <label className="movie-form__label">ratingNetflix</label>
        <input className="movie-form__input" type="number" step="0.1" value={form.ratingNetflix} onChange={(e) => patch({ ratingNetflix: e.target.value })} />
        <label className="movie-form__label">ageRestriction</label>
        <input className="movie-form__input" type="number" value={form.ageRestriction} onChange={(e) => patch({ ageRestriction: e.target.value })} />
        <label className="movie-form__label">like</label>
        <input className="movie-form__input" value={form.like} onChange={(e) => patch({ like: e.target.value })} />
        <label className="movie-form__label">dislike</label>
        <input className="movie-form__input" value={form.dislike} onChange={(e) => patch({ dislike: e.target.value })} />
        <label className="movie-form__label">specs.duration</label>
        <input className="movie-form__input" type="number" value={form.specs.duration} onChange={(e) => patch({ specs: { ...form.specs, duration: e.target.value } })} />
        <label className="movie-form__label">specs.ageRating</label>
        <input className="movie-form__input" value={form.specs.ageRating} onChange={(e) => patch({ specs: { ...form.specs, ageRating: e.target.value } })} />
        <label className="movie-form__label">specs.year</label>
        <input className="movie-form__input" type="number" value={form.specs.year} onChange={(e) => patch({ specs: { ...form.specs, year: e.target.value } })} />
        <label className="movie-form__label">specs.countries (vergul)</label>
        <input className="movie-form__input" onChange={(e) => patch({ specs: { ...form.specs, countries: normalizeCommaText(e.target.value) } })} />
        <label className="movie-form__label">specs.languages (vergul)</label>
        <input className="movie-form__input" onChange={(e) => patch({ specs: { ...form.specs, languages: normalizeCommaText(e.target.value) } })} />
      </div>
      </div>

      {error ? <p className="movie-form__error">{error}</p> : null}
      <div className="movie-form__actions">
        <button type="button" className="movie-form__cancel-btn" onClick={onCancel}>Bekor qilish</button>
        <button
          type="button"
          className="movie-form__save-btn"
          onClick={onSubmit}
          disabled={saving || isUploading}
        >
          {saving ? "Saqlanmoqda..." : isUploading ? "Yuklanmoqda..." : "Saqlash"}
        </button>
      </div>
    </div>
  );
}
