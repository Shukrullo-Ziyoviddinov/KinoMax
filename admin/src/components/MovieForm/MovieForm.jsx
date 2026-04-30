import { useEffect, useMemo, useRef, useState } from "react";
import { createMovie, fetchActorsForMovie, fetchMovies } from "../../services/movieApi";
import {
  CATEGORY_NAME_OPTIONS,
  CATEGORY_OPTIONS,
  FILTER_GENRE_OPTIONS,
  TRAILER_TYPE_OPTIONS,
  TYPE_CATEGORY_OPTIONS,
} from "../../constants/movieFormOptions";
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

function toDataUrl(file, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const emptyTrailer = () => ({
  id: Date.now() + Math.floor(Math.random() * 1000),
  trailers: { uz: "", ru: "" },
  title: { uz: "", ru: "" },
  text: { uz: "", ru: "" },
  like: "",
  dislike: "",
  typeTrailers: "action",
});

const emptySeason = (seasonNumber = 1) => ({
  seasonNumber,
  title: { uz: `Mavsum ${seasonNumber}`, ru: `Сезон ${seasonNumber}` },
  episodes: [{ uz: "", ru: "" }],
});

export default function MovieForm({ onCancel, onSaved }) {
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
      uz: { video: { type: "video", src: "" } },
      ru: { video: { type: "video", src: "" } },
    },
    rating: "",
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
    trailersVideo: [emptyTrailer()],
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
        const [moviesRows, actorRows] = await Promise.all([fetchMovies(), fetchActorsForMovie()]);
        const maxId = moviesRows.reduce((max, item) => Math.max(max, Number(item.id || item.movieId) || 0), 0);
        setForm((prev) => ({ ...prev, movieId: String(maxId + 1) }));
        setActors(actorRows);
      } catch (e) {
        setError(e.message || "Boshlang'ich ma'lumotlarni olishda xatolik.");
      }
    };
    run();
  }, []);

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

  const setUpload = (key, patch) => {
    setUploadState((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), ...patch } }));
  };

  const patch = (patchData) => setForm((prev) => ({ ...prev, ...patchData }));

  const onPickFile = async (key, pathUpdater, file) => {
    if (!file) return;
    setUpload(key, { uploading: true, progress: 1, fileName: file.name || "" });
    try {
      const data = await toDataUrl(file, (progress) => setUpload(key, { progress }));
      setForm((prev) => pathUpdater(prev, data));
      setUpload(key, { uploading: false, progress: 100 });
    } catch {
      setUpload(key, { uploading: false, progress: 0 });
      setError("Fayl yuklashda xatolik.");
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

  const updateTrailer = (index, updater) => {
    const next = [...form.trailersVideo];
    next[index] = updater(next[index]);
    patch({ trailersVideo: next });
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
      const payload = {
        id: toNumberOrDefault(form.movieId, 0),
        movieId: toNumberOrDefault(form.movieId, 0),
        movieCode: form.movieCode === "" ? undefined : toNumberOrDefault(form.movieCode, 0),
        title: form.title,
        titleImg: form.titleImg,
        homeImg: form.homeImg,
        movieMedia: form.movieMedia,
        rating: form.rating === "" ? 0 : Number(form.rating),
        ratingImdb: form.ratingImdb === "" ? 0 : Number(form.ratingImdb),
        ratingKinopoisk: form.ratingKinopoisk === "" ? 0 : Number(form.ratingKinopoisk),
        ratingNetflix: form.ratingNetflix === "" ? 0 : Number(form.ratingNetflix),
        ageRestriction: toNumberOrDefault(form.ageRestriction, 0),
        categoryName: form.categoryName,
        category: form.category,
        genre: form.genre,
        description: form.description,
        trailersVideo: form.trailersVideo,
        watchVideo: form.watchVideo,
        seasons: form.seasons,
        actors: form.actors,
        typeCategory: form.typeCategory,
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
      await createMovie(payload);
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
        <label className="movie-form__label">Movie ID</label>
        <input className="movie-form__input" value={form.movieId} onChange={(e) => patch({ movieId: e.target.value })} />
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

      <h4 className="movie-form__section">Asosiy videolar</h4>
      <div className="movie-form__section-card movie-form__upload-grid">
      {["movieMedia.uz", "movieMedia.ru", "watchVideo.uz", "watchVideo.ru"].map((key) => {
        return renderUploadField({
          keyName: key,
          label: key,
          accept: "video/*",
          onFile: (file) =>
            onPickFile(
              key,
              (prev, data) => {
                if (key.startsWith("movieMedia")) {
                  const lang = key.endsWith(".uz") ? "uz" : "ru";
                  return {
                    ...prev,
                    movieMedia: {
                      ...prev.movieMedia,
                      [lang]: { video: { type: "video", src: data } },
                    },
                  };
                }
                const lang = key.endsWith(".uz") ? "uz" : "ru";
                return { ...prev, watchVideo: { ...prev.watchVideo, [lang]: data } };
              },
              file
            ),
        });
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
      </div>
      </div>

      <h4 className="movie-form__section">Trailerlar</h4>
      {form.trailersVideo.map((trailer, index) => (
        <div className="movie-form__box" key={trailer.id}>
          <div className="movie-form__box-head">
            <strong>{index + 1}-Treyler</strong>
            <button type="button" className="movie-form__mini-btn" onClick={() => patch({ trailersVideo: form.trailersVideo.filter((_, i) => i !== index) })} disabled={form.trailersVideo.length === 1}>
              O'chirish
            </button>
          </div>
          <div className="movie-form__grid">
            <label className="movie-form__label">typeTrailers</label>
            <select className="movie-form__input" value={trailer.typeTrailers} onChange={(e) => updateTrailer(index, (prev) => ({ ...prev, typeTrailers: e.target.value }))}>
              {TRAILER_TYPE_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <label className="movie-form__label">Title UZ</label>
            <input className="movie-form__input" value={trailer.title.uz} onChange={(e) => updateTrailer(index, (prev) => ({ ...prev, title: { ...prev.title, uz: e.target.value } }))} />
            <label className="movie-form__label">Title RU</label>
            <input className="movie-form__input" value={trailer.title.ru} onChange={(e) => updateTrailer(index, (prev) => ({ ...prev, title: { ...prev.title, ru: e.target.value } }))} />
            <label className="movie-form__label">Text UZ</label>
            <textarea className="movie-form__textarea" value={trailer.text.uz} onChange={(e) => updateTrailer(index, (prev) => ({ ...prev, text: { ...prev.text, uz: e.target.value } }))} />
            <label className="movie-form__label">Text RU</label>
            <textarea className="movie-form__textarea" value={trailer.text.ru} onChange={(e) => updateTrailer(index, (prev) => ({ ...prev, text: { ...prev.text, ru: e.target.value } }))} />
            <label className="movie-form__label">Like</label>
            <input className="movie-form__input" type="number" value={trailer.like} onChange={(e) => updateTrailer(index, (prev) => ({ ...prev, like: e.target.value }))} />
            <label className="movie-form__label">Dislike</label>
            <input className="movie-form__input" type="number" value={trailer.dislike} onChange={(e) => updateTrailer(index, (prev) => ({ ...prev, dislike: e.target.value }))} />
          </div>
          {["uz", "ru"].map((lang) => {
            const key = `trailer-${index}-${lang}`;
            return renderUploadField({
              keyName: key,
              label: `Trailer video ${lang.toUpperCase()}`,
              accept: "video/*",
              onFile: (file) =>
                onPickFile(
                  key,
                  (prev, data) => {
                    const next = [...prev.trailersVideo];
                    next[index] = { ...next[index], trailers: { ...next[index].trailers, [lang]: data } };
                    return { ...prev, trailersVideo: next };
                  },
                  file
                ),
            });
          })}
        </div>
      ))}
      <button type="button" className="movie-form__add-btn" onClick={() => patch({ trailersVideo: [...form.trailersVideo, emptyTrailer()] })}>
        + Treyler qo'shish
      </button>

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
                  onClick={() => {
                    patch({ categoryName: item });
                    setCategoryNameOpen(false);
                  }}
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
                  onClick={() => {
                    patch({ category: item });
                    setCategoryOpen(false);
                  }}
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
        <label className="movie-form__label">rating</label>
        <input className="movie-form__input" type="number" step="0.1" value={form.rating} onChange={(e) => patch({ rating: e.target.value })} />
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
        <button type="button" className="movie-form__save-btn" onClick={onSubmit} disabled={saving}>
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </button>
      </div>
    </div>
  );
}
