import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { allMovies } from '../../data/moviesCatalog';
import { formatActionCount } from '../../utils/utils';
import LoaderSkeleton from '../LoaderSkeleton/LoaderSkeleton';
import VerticalScroll from './VerticalScroll';
import './SimilarTrailers.css';

const SimilarTrailers = ({ 
  currentMovie, 
  selectedTrailer, 
  onTrailerSelect,
  trailerReactions,
  getTrailerKey,
  onLike,
  onDislike,
  getReactionCounts,
  getUserReaction,
  trailerLoading = false
}) => {
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();

  const similarTrailers = useMemo(() => {
    const currentTypeTrailers = selectedTrailer?.typeTrailers || '';
    if (!currentTypeTrailers) return [];

    return allMovies
      .flatMap((movie) =>
        (movie.trailersVideo || []).map((trailer) => ({
          ...trailer,
          movieId: movie.id,
          movieTitle: movie.title
        }))
      )
      .filter((trailer) => {
        const isSameType = trailer.typeTrailers === currentTypeTrailers;
        const isNotCurrent = !(
          trailer.movieId === currentMovie?.id && trailer.id === selectedTrailer?.id
        );
        return isSameType && isNotCurrent;
      });
  }, [selectedTrailer?.typeTrailers, selectedTrailer?.id, currentMovie?.id]);

  if (trailerLoading) {
    return (
      <div className="similar-trailers-container">
        <LoaderSkeleton variant="similar-trailers-title" className="similar-trailers-title-skeleton" width={200} height={28} />
        <VerticalScroll className="similar-trailers-scroll-wrapper">
          <div className="similar-trailers-list">
            <LoaderSkeleton variant="similar-trailer-item" className="similar-trailer-item-skeleton" width="100%" height={90} />
            <LoaderSkeleton variant="similar-trailer-item" className="similar-trailer-item-skeleton" width="100%" height={90} />
            <LoaderSkeleton variant="similar-trailer-item" className="similar-trailer-item-skeleton" width="100%" height={90} />
          </div>
        </VerticalScroll>
      </div>
    );
  }

  if (similarTrailers.length === 0) {
    return (
      <div className="similar-trailers-container">
        <h4 className="similar-trailers-title">{t('detail.similarTrailers')}</h4>
        <div className="similar-trailers-no-trailers">
          <p>{t('detail.noSimilarTrailers') || 'No similar trailers available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="similar-trailers-container">
      <h4 className="similar-trailers-title">{t('detail.similarTrailers')}</h4>
      <VerticalScroll className="similar-trailers-scroll-wrapper">
        <div className="similar-trailers-list">
          {similarTrailers.map((trailer) => (
            <div
              key={`${trailer.movieId}-${trailer.id}`}
              className="similar-trailer-item"
              onClick={() => onTrailerSelect(trailer)}
            >
              <div className="similar-trailer-video">
                <video
                  src={trailer.trailers?.[contentLang] || trailer.trailers?.uz || trailer.trailers?.ru || ''}
                  muted
                  playsInline
                  preload="none"
                  className="similar-trailer-video-element"
                />
                <div className="similar-trailer-play">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                </div>
              </div>
              <div className="similar-trailer-info">
                <div className="similar-trailer-title">
                  {trailer.title?.[contentLang] || trailer.title?.uz || trailer.title?.ru || ''}
                </div>
                <div className="similar-trailer-text">
                  {trailer.text?.[contentLang] || trailer.text?.uz || trailer.text?.ru || ''}
                </div>
                <div className="similar-trailer-actions">
                  <div 
                    className={`similar-trailer-like ${getUserReaction && getUserReaction(trailer) === 'like' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onLike) onLike(trailer);
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
                    </svg>
                    <span>{formatActionCount(getReactionCounts ? getReactionCounts(trailer).like : (trailer.like || '0'))}</span>
                  </div>
                  <div 
                    className={`similar-trailer-dislike ${getUserReaction && getUserReaction(trailer) === 'dislike' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDislike) onDislike(trailer);
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/>
                    </svg>
                    <span>{formatActionCount(getReactionCounts ? getReactionCounts(trailer).dislike : (trailer.dislike || '0'))}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </VerticalScroll>
    </div>
  );
};

export default SimilarTrailers;
