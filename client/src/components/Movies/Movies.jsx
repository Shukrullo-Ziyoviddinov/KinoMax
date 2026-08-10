import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useMoviesCatalog } from '../../context/MoviesCatalogContext';
import { useWishlist } from '../../context/WishlistContext';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useLoading } from '../../context/LoadingContext';
import { normalizeMediaUrl } from '../../utils/mediaUrl';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import ShowMoreButton, { getDisplayItems, shouldShowMore, DEFAULT_LIMIT } from '../ShowMoreButton/ShowMoreButton';
import LoaderSkeleton from '../LoaderSkeleton/LoaderSkeleton';
import './Movies.css';

const Movies = ({ sectionType = 'recommended', limit = DEFAULT_LIMIT, filteredMovies = null, showHorizontalScroll = false, headerTitle = null, headerCount = null, hideHeader = false, moreTo = null, isLoading: isLoadingProp = null, sectionHasMore = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { contentLang } = useContentLanguage();
  const { moviesLoading } = useLoading();
  const { allMovies, recommendedMovies } = useMoviesCatalog();
  const isLoading = isLoadingProp ?? moviesLoading;

  let allMoviesData = filteredMovies || allMovies;
  if (sectionType === 'recommended' && !filteredMovies) {
    allMoviesData = recommendedMovies;
  }

  const shouldShowLimit = limit != null;
  const displayMovies = getDisplayItems(allMoviesData, shouldShowLimit ? limit : null);
  const hasMoreMovies = shouldShowMore(allMoviesData, limit, moreTo) || Boolean(sectionHasMore);
  const placeholderCount = shouldShowLimit ? Math.max(4, Math.min(limit || DEFAULT_LIMIT, 8)) : 8;
  const shouldRenderPlaceholders = isLoading && allMoviesData.length === 0;

  const getMovieTitle = (movie) => {
    if (movie.title && typeof movie.title === 'object') {
      return movie.title[contentLang] || movie.title.uz || movie.title.ru;
    }
    return movie.title || '';
  };

  const getImdbRating = (movie) => {
    const value = movie?.ratingImdb;
    if (value == null || value === '' || value === 'none') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const handleMovieClick = (movieId) => {
    navigate(`/movie/${movieId}`);
  };


  const isHorizontal = showHorizontalScroll;
  const isWideLayout = false;

  const renderMovieItem = (movie, index) => {
    const imdbRating = getImdbRating(movie);

    // Dataset can contain duplicate numeric ids, so include index to keep keys unique.
    return (
    <div
      key={`${movie.id}-${index}`}
      className={`movies-item ${isHorizontal ? 'movies-item-horizontal' : ''} ${isWideLayout ? 'movies-item-wide' : ''}`}
      onClick={() => !isLoading && handleMovieClick(movie.id)}
    >
      <div className="movies-item-image-wrapper">
        {isLoading ? (
          <LoaderSkeleton variant="image" />
        ) : (
          <>
            <img
              src={normalizeMediaUrl(
                movie.homeImg
                  ? movie.homeImg[contentLang] || movie.homeImg.uz || movie.homeImg.ru
                  : ''
              )}
              alt={getMovieTitle(movie)}
              className="movies-item-image"
            />
            <button
              className={`movies-item-wishlist-btn ${isInWishlist(movie.id) ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(movie.id);
              }}
              aria-label="Sevimlilarga qo'shish"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(movie.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            {movie.category === 'anonslar' ? (
              <div className="movies-item-badge movies-item-badge-soon">{t('searchModal.tezOrada', 'Tez orada')}</div>
            ) : (
              <div className="movies-item-badge movies-item-badge-fhd">FHD</div>
            )}
            {movie.ageRestriction != null && (
              <div className="movies-item-badge movies-item-badge-age">{movie.ageRestriction}+</div>
            )}
            {imdbRating != null && (
              <div className="movies-item-rating">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {imdbRating}
              </div>
            )}
          </>
        )}
      </div>
      {isLoading ? (
        <LoaderSkeleton variant="text" className="movies-item-title-skeleton" width="85%" height={16} />
      ) : (
        getMovieTitle(movie) && (
          <p className="movies-item-title">{getMovieTitle(movie)}</p>
        )
      )}
    </div>
    );
  };

  return (
    <div className="movies">
      <div className="movies-container">
        {!hideHeader && (
          <div className={`movies-header ${headerCount !== null ? 'movies-header--centered' : ''}`}>
            {headerCount !== null && (
              <p className="movies-header-count">{headerCount} {t('movies.all')}</p>
            )}
            {isLoading ? (
              <LoaderSkeleton variant="text" className="movies-title-skeleton" width="180px" height="28px" />
            ) : (
              <h2 className="movies-title">{headerTitle || t(`movies.${sectionType}`)}</h2>
            )}
            {headerCount === null && (hasMoreMovies || (isLoading && moreTo)) && (
              isLoading ? (
                <LoaderSkeleton variant="button" className="more-btn-skeleton" width="90px" height="36px" />
              ) : (
                <ShowMoreButton to={moreTo || '/recommended'} />
              )
            )}
          </div>
        )}
        <div className="movies-content-wrapper">
          {isHorizontal && shouldShowLimit ? (
            <HorizontalScroll>
              {shouldRenderPlaceholders
                ? Array.from({ length: placeholderCount }).map((_, index) => (
                    <div
                      key={`movies-placeholder-${index}`}
                      className={`movies-item ${isHorizontal ? 'movies-item-horizontal' : ''} ${isWideLayout ? 'movies-item-wide' : ''}`}
                    >
                      <div className="movies-item-image-wrapper">
                        <LoaderSkeleton variant="image" />
                      </div>
                      <LoaderSkeleton variant="text" className="movies-item-title-skeleton" width="85%" height={16} />
                    </div>
                  ))
                : displayMovies.map((movie, index) => renderMovieItem(movie, index))}
            </HorizontalScroll>
          ) : (
            <div className="movies-grid">
              {shouldRenderPlaceholders
                ? Array.from({ length: placeholderCount }).map((_, index) => (
                    <div
                      key={`movies-placeholder-${index}`}
                      className={`movies-item ${isHorizontal ? 'movies-item-horizontal' : ''} ${isWideLayout ? 'movies-item-wide' : ''}`}
                    >
                      <div className="movies-item-image-wrapper">
                        <LoaderSkeleton variant="image" />
                      </div>
                      <LoaderSkeleton variant="text" className="movies-item-title-skeleton" width="85%" height={16} />
                    </div>
                  ))
                : displayMovies.map((movie, index) => renderMovieItem(movie, index))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Movies;
