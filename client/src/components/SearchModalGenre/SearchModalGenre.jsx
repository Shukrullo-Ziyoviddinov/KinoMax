import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import { fetchGenres } from '../../api/genresApi';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import LoaderSkeleton from '../LoaderSkeleton/LoaderSkeleton';
import './SearchModalGenre.css';

const GenreItem = ({ genre, title, onClick }) => {
  const imgRef = useRef(null);
  const tapRef = useRef({ x: 0, y: 0, moved: false });
  const handledByTouchRef = useRef(false);
  const [imageLoading, setImageLoading] = useState(Boolean(genre?.img));

  useEffect(() => {
    const hasImage = Boolean(genre?.img);
    setImageLoading(hasImage);

    const img = imgRef.current;
    if (hasImage && img?.complete && img.naturalWidth > 0) {
      setImageLoading(false);
    }
  }, [genre?.img]);

  const activate = () => {
    onClick?.();
  };

  const handleClick = () => {
    if (handledByTouchRef.current) return;
    activate();
  };

  const handleTouchStart = (event) => {
    tapRef.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
      moved: false,
    };
  };

  const handleTouchMove = (event) => {
    const dx = Math.abs(event.touches[0].clientX - tapRef.current.x);
    const dy = Math.abs(event.touches[0].clientY - tapRef.current.y);
    if (dx > 8 || dy > 8) {
      tapRef.current.moved = true;
    }
  };

  const handleTouchEnd = (event) => {
    if (tapRef.current.moved) return;

    event.preventDefault();
    event.stopPropagation();
    handledByTouchRef.current = true;
    activate();
    window.setTimeout(() => {
      handledByTouchRef.current = false;
    }, 400);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`search-modal-genre-item${imageLoading ? ' is-loading' : ''}`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      }}
    >
      <div className="search-modal-genre-item-image-wrapper">
        {imageLoading && (
          <LoaderSkeleton
            variant="banner-image"
            className="search-modal-genre-item-image-skeleton"
          />
        )}
        <img
          ref={imgRef}
          src={genre.img}
          alt={title}
          className={`search-modal-genre-item-image ${imageLoading ? 'is-loading' : ''}`}
          onLoad={() => setImageLoading(false)}
          onError={() => setImageLoading(false)}
        />
        {imageLoading ? (
          <div className="search-modal-genre-item-title-slot" aria-hidden="true">
            <LoaderSkeleton
              variant="text"
              className="search-modal-genre-item-title-skeleton"
              width="70%"
              height={14}
            />
          </div>
        ) : (
          <span className="search-modal-genre-item-title">{title}</span>
        )}
      </div>
    </div>
  );
};

const SearchModalGenre = ({ onGenreClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const [genres, setGenres] = useState([]);
  const [genresLoading, setGenresLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadGenres = async () => {
      try {
        if (isMounted) setGenresLoading(true);
        const data = await fetchGenres();
        if (isMounted) setGenres(data);
      } catch (_error) {
        if (isMounted) setGenres([]);
      } finally {
        if (isMounted) setGenresLoading(false);
      }
    };

    loadGenres();
    return () => {
      isMounted = false;
    };
  }, []);

  const getGenreTitle = (genre) => {
    if (genre.title && typeof genre.title === 'object') {
      return genre.title[contentLang] || genre.title.uz || genre.title.ru;
    }
    return genre.title || '';
  };

  const handleGenreClick = (genre) => {
    if (onGenreClick) {
      onGenreClick();
    }
    const filterValue = Array.isArray(genre.filterGenre)
      ? genre.filterGenre[0]
      : genre.filterGenre;
    navigate(`/recommended?genre=${encodeURIComponent(filterValue)}`);
  };

  return (
    <div className="search-modal-genre">
      <h3 className="search-modal-genre-title">{t('filters.genre', 'Janr')}</h3>
      <HorizontalScroll scrollAmount={320}>
        {genresLoading
          ? Array.from({ length: 5 }).map((_, idx) => (
              <div key={`genre-skeleton-${idx}`} className="search-modal-genre-item">
                <div className="search-modal-genre-item-image-wrapper">
                  <LoaderSkeleton
                    variant="banner-image"
                    className="search-modal-genre-item-image-skeleton"
                  />
                </div>
              </div>
            ))
          : genres.map((genre) => (
              <GenreItem
                key={genre.genreId}
                genre={genre}
                title={getGenreTitle(genre)}
                onClick={() => handleGenreClick(genre)}
              />
            ))}
      </HorizontalScroll>
    </div>
  );
};

export default SearchModalGenre;
