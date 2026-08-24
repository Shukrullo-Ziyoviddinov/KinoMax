import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { fetchWeeklyTopMovies, WEEKLY_TOP_LIMIT } from '../../api/moviesApi';
import { useWishlist } from '../../context/WishlistContext';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import LoaderSkeleton from '../LoaderSkeleton/LoaderSkeleton';
import './WeeklyTopMovies.css';

const WeeklyTopMovies = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { contentLang } = useContentLanguage();
  const [movies, setMovies] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        const data = await fetchWeeklyTopMovies({ limit: WEEKLY_TOP_LIMIT });
        if (isMounted) {
          setMovies(data.items || []);
        }
      } catch (error) {
        console.error('[WeeklyTopMovies] yuklashda xatolik:', error?.message || error);
        if (isMounted) setMovies([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

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

  // Bo'sh bo'lim (hech kim login qilib ko'rmagan) — ko'rsatilmaydi
  if (!isLoading && movies.length === 0) {
    return null;
  }

  return (
    <div className="movies weekly-top">
      <div className="movies-container">
        <div className="movies-header">
          {isLoading ? (
            <LoaderSkeleton variant="text" className="movies-title-skeleton" width="260px" height="28px" />
          ) : (
            <h2 className="movies-title">{t('movies.weeklyTop')}</h2>
          )}
        </div>

        <div className="movies-content-wrapper">
          <HorizontalScroll>
            {isLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div key={`weekly-top-ph-${index}`} className="weekly-top-item">
                    <span className="weekly-top-rank" aria-hidden="true">
                      <span className="weekly-top-rank-text" data-rank={index + 1}>{index + 1}</span>
                    </span>
                    <div className="movies-item movies-item-horizontal weekly-top-card">
                      <div className="movies-item-image-wrapper">
                        <LoaderSkeleton variant="image" />
                      </div>
                      <LoaderSkeleton variant="text" className="movies-item-title-skeleton" width="85%" height={16} />
                    </div>
                  </div>
                ))
              : movies.map((movie, index) => {
                  const rank = movie.weeklyRank || index + 1;
                  const isWideRank = rank >= 10;
                  const imdbRating = getImdbRating(movie);
                  return (
                    <div
                      key={`${movie.id}-${rank}`}
                      className={`weekly-top-item${isWideRank ? ' weekly-top-item--wide' : ''}`}
                    >
                      <span className="weekly-top-rank" aria-hidden="true">
                        <span className="weekly-top-rank-text" data-rank={rank}>{rank}</span>
                      </span>
                      <div
                        className="movies-item movies-item-horizontal weekly-top-card"
                        onClick={() => navigate(`/movie/${movie.id}`)}
                      >
                        <div className="movies-item-image-wrapper">
                          <img
                            src={
                              movie.homeImg
                                ? movie.homeImg[contentLang] || movie.homeImg.uz || movie.homeImg.ru
                                : ''
                            }
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
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill={isInWishlist(movie.id) ? 'currentColor' : 'none'}
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                          </button>
                          <div className="movies-item-badge movies-item-badge-fhd">FHD</div>
                          {movie.ageRestriction != null && (
                            <div className="movies-item-badge movies-item-badge-age">
                              {movie.ageRestriction}+
                            </div>
                          )}
                          {imdbRating != null && (
                            <div className="movies-item-rating">
                              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                              {imdbRating}
                            </div>
                          )}
                        </div>
                        {getMovieTitle(movie) && (
                          <p className="movies-item-title">{getMovieTitle(movie)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
          </HorizontalScroll>
        </div>
      </div>
    </div>
  );
};

export default WeeklyTopMovies;
