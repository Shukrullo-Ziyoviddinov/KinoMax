import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import { fetchGenres } from '../../api/genresApi';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import LoaderSkeleton from '../LoaderSkeleton/LoaderSkeleton';
import './SearchModalGenre.css';

const GenreItem = ({ genre, title, onClick }) => {
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <div className="search-modal-genre-item" onClick={onClick}>
      <div className="search-modal-genre-item-image-wrapper">
        {imageLoading && (
          <LoaderSkeleton
            variant="banner-image"
            className="search-modal-genre-item-image-skeleton"
          />
        )}
        <img
          src={genre.img}
          alt={title}
          className={`search-modal-genre-item-image ${imageLoading ? 'is-loading' : ''}`}
          onLoad={() => setImageLoading(false)}
          onError={() => setImageLoading(false)}
        />
        <span className="search-modal-genre-item-title">{title}</span>
      </div>
    </div>
  );
};

const SearchModalGenre = ({ onGenreClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadGenres = async () => {
      try {
        const data = await fetchGenres();
        if (isMounted) setGenres(data);
      } catch (_error) {
        if (isMounted) setGenres([]);
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
        {genres.map((genre) => (
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
