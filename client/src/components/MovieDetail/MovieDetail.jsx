import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchMovieById } from '../../api/moviesApi';
import { fetchActorsByIds } from '../../api/actorsApi';
import { useWishlist } from '../../context/WishlistContext';
import { useViewedMovies } from '../../context/ViewedMoviesContext';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useLoading } from '../../context/LoadingContext';
import LoaderSkeleton from '../LoaderSkeleton/LoaderSkeleton';
import TrailerModal from './TrailerModal';
import WatchModal from './WatchModal';
import MovieComments from './MovieComments';
import SimilarMovies from './SimilarMovies';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import ShareButton from '../ShareButton/ShareButton';
import { formatActionCount } from '../../utils/utils';
import './MovieDetail.css';

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addMovie } = useViewedMovies();
  const { detailLoading, setLoading } = useLoading();
  const [movie, setMovie] = useState(null);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [showWatchModal, setShowWatchModal] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState(null);
  const [seasonsLang, setSeasonsLang] = useState(i18n.language === 'uz' ? 'uz' : 'ru');
  const { contentLang } = useContentLanguage();
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [actorsLoading, setActorsLoading] = useState(false);
  const [modalStartY, setModalStartY] = useState(0);
  const [modalCurrentY, setModalCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const videoRef = React.useRef(null);
  const modalRef = React.useRef(null);
  const commentsModalRef = useRef(null);
  const [commentsCount, setCommentsCount] = useState(0);
  const [movieActors, setMovieActors] = useState([]);
  const modalHeaderRef = React.useRef(null);
  const isDraggingRef = React.useRef(false);
  const modalStartYRef = React.useRef(0);

  useEffect(() => {
    if (movie) addMovie(movie);
  }, [movie, addMovie]);

  useEffect(() => {
    let cancelled = false;

    const loadMovie = async () => {
      if (!id) {
        setMovie(null);
        return;
      }

      setLoading('detail', true);
      try {
        const data = await fetchMovieById(id);
        if (!cancelled) setMovie(data);
      } catch (_error) {
        if (!cancelled) setMovie(null);
      } finally {
        if (!cancelled) setLoading('detail', false);
      }
    };

    loadMovie();
    return () => {
      cancelled = true;
    };
  }, [id, setLoading]);

  useEffect(() => {
    setCommentsCount(0);
  }, [movie?.id]);

  useEffect(() => {
    let isMounted = true;

    const loadActors = async () => {
      if (!movie?.actors?.length) {
        if (isMounted) setMovieActors([]);
        if (isMounted) setActorsLoading(false);
        return;
      }

      try {
        if (isMounted) setActorsLoading(true);
        const actors = await fetchActorsByIds(movie.actors);
        if (isMounted) setMovieActors(actors);
      } catch (_error) {
        if (isMounted) setMovieActors([]);
      } finally {
        if (isMounted) setActorsLoading(false);
      }
    };

    loadActors();
    return () => {
      isMounted = false;
    };
  }, [movie]);

  useEffect(() => {
    if (!movie?.seasons?.length) {
      setSelectedSeason(null);
      return;
    }
    if (selectedSeason === null) {
      setSelectedSeason(movie?.seasons?.[0]?.seasonNumber);
    } else {
      const exists = movie?.seasons?.some((s) => s.seasonNumber === selectedSeason);
      if (!exists) setSelectedSeason(movie?.seasons?.[0]?.seasonNumber);
    }
  }, [movie, selectedSeason]);

  useEffect(() => {
    if (!movie?.seasons?.length || selectedSeason == null) return;
    const currentSeason = movie?.seasons?.find((s) => s.seasonNumber === selectedSeason);
    const hasUz = currentSeason?.episodes?.some((ep) => ep.uz && ep.uz !== 'none');
    const hasRu = currentSeason?.episodes?.some((ep) => ep.ru && ep.ru !== 'none');
    if (seasonsLang === 'ru' && !hasRu) setSeasonsLang('uz');
    else if (seasonsLang === 'uz' && !hasUz && hasRu) setSeasonsLang('ru');
  }, [movie, selectedSeason, seasonsLang]);

  // FILM sahifasi like/dislike — faqat movie.id orqali (trailer_reactions dan FARQ)
  // Key: movie_1, movie_2... — har bir kino alohida
  useEffect(() => {
    if (movie) {
      const key = `movie_${movie.id}`;
      const baseLikes = (movie.like !== '' && movie.like !== undefined && movie.like !== null)
        ? (parseInt(movie.like, 10) || 0)
        : 0;
      const baseDislikes = (movie.dislike !== '' && movie.dislike !== undefined && movie.dislike !== null)
        ? (parseInt(movie.dislike, 10) || 0)
        : 0;
      const isLiked = localStorage.getItem(`${key}_isLiked`) === 'true';
      const isDisliked = localStorage.getItem(`${key}_isDisliked`) === 'true';

      setLikeCount(baseLikes + (isLiked ? 1 : 0));
      setDislikeCount(baseDislikes + (isDisliked ? 1 : 0));
      setIsLiked(isLiked);
      setIsDisliked(isDisliked);
    }
  }, [movie]);

  useEffect(() => {
    if (showDescriptionModal) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [showDescriptionModal]);

  // SEO: title (movies.js), description, og:image, JSON-LD — Google uchun kuchaytirilgan
  useEffect(() => {
    if (!movie) return;
    const lang = contentLang;
    // movies.js title.uz / title.ru — to'g'ri ishlatiladi
    const pageTitle = movie.title?.[lang] || movie.title?.uz || movie.title?.ru || '';
    const descSource = movie.description?.[lang] || movie.description?.uz || movie.description?.ru || movie.description;
    const pageDesc = typeof descSource === 'object' && descSource?.text ? descSource.text : (descSource || '');
    const imgUrl = movie.titleImg?.[lang] || movie.titleImg?.uz || movie.titleImg?.ru
      || movie.homeImg?.[lang] || movie.homeImg?.uz || movie.homeImg?.ru;
    const fullImgUrl = imgUrl ? `${window.location.origin}${imgUrl}` : '';
    const canonicalUrl = `${window.location.origin}/movie/${movie.id}`;
    const genres = movie.genre?.[lang] || movie.genre?.uz || movie.genre?.ru || [];
    const keywords = Array.isArray(genres) ? genres.join(', ') : (genres || '');

    const setMeta = (name, content, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content || '');
    };

    const setLink = (rel, href) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // Title — movies.js title.uz / title.ru
    document.title = pageTitle ? `${pageTitle} | Violet Movie - Filmlar onlayn` : 'Violet Movie - Filmlar onlayn';
    setMeta('description', pageDesc?.substring(0, 160) || '');
    setMeta('keywords', `${pageTitle}, ${keywords}, film, kino, online, Violet Movie`.trim());

    // Open Graph
    setMeta('og:title', pageTitle ? `${pageTitle} | Violet Movie` : 'Violet Movie', true);
    setMeta('og:description', pageDesc?.substring(0, 160) || '', true);
    setMeta('og:image', fullImgUrl, true);
    setMeta('og:url', canonicalUrl, true);
    setMeta('og:type', 'video.movie', true);
    setMeta('og:site_name', 'Violet Movie', true);
    setMeta('og:locale', lang === 'ru' ? 'ru_RU' : 'uz_UZ', true);
    setMeta('og:locale:alternate', lang === 'ru' ? 'uz_UZ' : 'ru_RU', true);

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', pageTitle ? `${pageTitle} | Violet Movie` : 'Violet Movie');
    setMeta('twitter:description', pageDesc?.substring(0, 160) || '');
    setMeta('twitter:image', fullImgUrl);

    // Canonical URL
    setLink('canonical', canonicalUrl);

    // JSON-LD — Google rich results (rejting, yil, aktyorlar)
    const descData = movie.description?.[lang] || movie.description?.uz || movie.description?.ru;
    const year = (typeof descData === 'object' && descData?.year) || movie.specs?.year;
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Movie',
      name: pageTitle,
      description: pageDesc?.substring(0, 200) || '',
      image: fullImgUrl,
      datePublished: year ? `${year}-01-01` : undefined,
      ...(movie.ratingImdb && { aggregateRating: { '@type': 'AggregateRating', ratingValue: movie.ratingImdb, bestRating: 10, worstRating: 0 } }),
      ...(Array.isArray(genres) && genres.length && { genre: genres })
    };
    let scriptEl = document.getElementById('movie-json-ld');
    if (scriptEl) scriptEl.remove();
    scriptEl = document.createElement('script');
    scriptEl.id = 'movie-json-ld';
    scriptEl.type = 'application/ld+json';
    scriptEl.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(scriptEl);

    return () => {
      document.title = 'Violet Movie - Filmlar onlayn';
      document.getElementById('movie-json-ld')?.remove();
    };
  }, [movie, contentLang]);

  // Mobile modal touchmove — passive: false (preventDefault uchun)
  const handleModalTouchMove = (e) => {
    if (window.innerWidth <= 768 && isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - modalStartYRef.current;
      if (deltaY > 0) {
        setModalCurrentY(currentY);
      } else {
        setModalCurrentY(modalStartYRef.current);
      }
    }
  };

  useEffect(() => {
    if (!showDescriptionModal || !modalHeaderRef.current) return;
    const el = modalHeaderRef.current;
    const handler = handleModalTouchMove;
    el.addEventListener('touchmove', handler, { passive: false });
    return () => el.removeEventListener('touchmove', handler);
  }, [showDescriptionModal]);

  if (!movie && !detailLoading) {
    return (
      <div className="movie-detail-error">
        <h2>Movie not found</h2>
        <button onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  if (detailLoading) {
    return (
      <div className="movie-detail">
        <div className="movie-detail-bg-block">
          <div className="movie-detail-bg" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), #0a0a0a)' }} />
          <div className="movie-detail-container">
            <div className="movie-detail-content">
              <div className="movie-detail-image-block">
                <LoaderSkeleton variant="detail-image" className="movie-detail-image-skeleton" />
              </div>
              <div className="movie-detail-info-block">
                <div className="movie-detail-info">
                  <LoaderSkeleton variant="detail-title" className="movie-detail-title-skeleton" />
                  <LoaderSkeleton variant="detail-specs" className="movie-detail-specs-skeleton" />
                  <LoaderSkeleton variant="detail-actions" className="movie-detail-actions-skeleton" />
                  <div className="movie-detail-buttons-skeleton" style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <LoaderSkeleton variant="button" className="movie-detail-btn-primary-skeleton" width={140} height={48} />
                    <LoaderSkeleton variant="button" className="movie-detail-btn-secondary-skeleton" width={120} height={48} />
                  </div>
                  <LoaderSkeleton variant="detail-description" className="movie-detail-description-skeleton" />
                  <LoaderSkeleton variant="detail-description-more-btn" className="movie-detail-description-more-btn-skeleton" width={100} height={36} />
                  <div className="movie-detail-comments-skeleton">
                    <LoaderSkeleton variant="comments-title" className="movie-detail-comments-title-skeleton" width={180} height={28} />
                    <LoaderSkeleton variant="comments-input-wrap" className="movie-detail-comments-input-wrap-skeleton" />
                  </div>
                  <div className="movie-detail-actors-skeleton">
                    <LoaderSkeleton variant="text" className="movie-detail-actors-title-skeleton" width={140} height={24} />
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'nowrap', overflow: 'hidden', marginTop: '1rem' }}>
                      <LoaderSkeleton variant="actor-item" width={80} height={100} />
                      <LoaderSkeleton variant="actor-item" width={80} height={100} />
                      <LoaderSkeleton variant="actor-item" width={80} height={100} />
                      <LoaderSkeleton variant="actor-item" width={80} height={100} />
                      <LoaderSkeleton variant="actor-item" width={80} height={100} />
                    </div>
                  </div>
                  <div className="movie-detail-seasons-skeleton">
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                      <LoaderSkeleton variant="seasons-tab" width={50} height={40} />
                      <LoaderSkeleton variant="seasons-tab" width={50} height={40} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <LoaderSkeleton variant="season-btn" width={100} height={40} />
                      <LoaderSkeleton variant="season-btn" width={110} height={40} />
                      <LoaderSkeleton variant="season-btn" width={90} height={40} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'nowrap', overflow: 'hidden' }}>
                      <LoaderSkeleton variant="episode-video" width={160} height={90} />
                      <LoaderSkeleton variant="episode-video" width={160} height={90} />
                      <LoaderSkeleton variant="episode-video" width={160} height={90} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="movie-detail-container movie-detail-similar-wrapper">
          <div className="similar-movies similar-movies-skeleton">
            <LoaderSkeleton variant="similar-movies-title" className="similar-movies-title-skeleton" width={200} height={28} />
            <div style={{ display: 'flex', gap: '1rem', overflow: 'hidden' }}>
              <LoaderSkeleton variant="similar-movies-item-image" className="similar-movies-item-skeleton" width={150} />
              <LoaderSkeleton variant="similar-movies-item-image" className="similar-movies-item-skeleton" width={150} />
              <LoaderSkeleton variant="similar-movies-item-image" className="similar-movies-item-skeleton" width={150} />
              <LoaderSkeleton variant="similar-movies-item-image" className="similar-movies-item-skeleton" width={150} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getMovieTitle = () => {
    const lang = contentLang;
    if (movie.title && typeof movie.title === 'object') {
      return movie.title[lang] || movie.title.uz || movie.title.ru;
    }
    return movie.title || '';
  };

  const getMovieGenres = () => {
    const lang = contentLang;
    if (movie.genre && typeof movie.genre === 'object') {
      return Array.isArray(movie.genre[lang]) ? movie.genre[lang] : (movie.genre[lang] ? [movie.genre[lang]] : movie.genre.uz || movie.genre.ru || []);
    }
    return Array.isArray(movie.genre) ? movie.genre : [movie.genre || ''];
  };

  const getMovieDescription = () => {
    const lang = contentLang;
    if (movie.description && typeof movie.description === 'object') {
      // Check if it's the new format with text, year, etc.
      if (movie.description[lang] && typeof movie.description[lang] === 'object' && movie.description[lang].text) {
        return movie.description[lang];
      }
      if (movie.description.uz && typeof movie.description.uz === 'object' && movie.description.uz.text) {
        return movie.description.uz;
      }
      if (movie.description.ru && typeof movie.description.ru === 'object' && movie.description.ru.text) {
        return movie.description.ru;
      }
      // Old format - just string
      return movie.description[lang] || movie.description.uz || movie.description.ru;
    }
    return movie.description || '';
  };

  const getDescriptionText = () => {
    const desc = getMovieDescription();
    if (typeof desc === 'object' && desc.text) {
      return desc.text;
    }
    return desc || '';
  };

  const getDescriptionData = () => {
    const desc = getMovieDescription();
    if (typeof desc === 'object' && desc.text) {
      return desc;
    }
    return null;
  };

  const getMovieVideo = () => {
    const lang = contentLang;
    
    if (!movie.movieMedia || typeof movie.movieMedia !== 'object') {
      return null;
    }
    
    const langData = movie.movieMedia[lang] || movie.movieMedia.uz || movie.movieMedia.ru;
    
    if (!langData || typeof langData !== 'object') {
      return null;
    }
    
    if (langData.video && typeof langData.video === 'object') {
      const src = langData.video.src;
      if (src && typeof src === 'string' && src.trim() !== '') {
        return src;
      }
    }
    
    return null;
  };

  const handleLike = () => {
    const key = `movie_${movie.id}`; // film sahifasi — movie_1, movie_2...
    const baseLikes = (movie.like !== '' && movie.like !== undefined && movie.like !== null)
      ? (parseInt(movie.like, 10) || 0)
      : 0;
    const baseDislikes = (movie.dislike !== '' && movie.dislike !== undefined && movie.dislike !== null)
      ? (parseInt(movie.dislike, 10) || 0)
      : 0;
    const wasLiked = localStorage.getItem(`${key}_isLiked`) === 'true';
    const wasDisliked = localStorage.getItem(`${key}_isDisliked`) === 'true';

    if (wasLiked) {
      setIsLiked(false);
      setIsDisliked(wasDisliked);
      setLikeCount(baseLikes);
      setDislikeCount(baseDislikes + (wasDisliked ? 1 : 0));
      localStorage.setItem(`${key}_isLiked`, 'false');
    } else {
      setIsLiked(true);
      setIsDisliked(false);
      setLikeCount(baseLikes + 1);
      setDislikeCount(baseDislikes);
      localStorage.setItem(`${key}_isLiked`, 'true');
      localStorage.setItem(`${key}_isDisliked`, 'false');
    }
  };

  const handleDislike = () => {
    const key = `movie_${movie.id}`; // film sahifasi — movie_1, movie_2...
    const baseLikes = (movie.like !== '' && movie.like !== undefined && movie.like !== null)
      ? (parseInt(movie.like, 10) || 0)
      : 0;
    const baseDislikes = (movie.dislike !== '' && movie.dislike !== undefined && movie.dislike !== null)
      ? (parseInt(movie.dislike, 10) || 0)
      : 0;
    const wasLiked = localStorage.getItem(`${key}_isLiked`) === 'true';
    const wasDisliked = localStorage.getItem(`${key}_isDisliked`) === 'true';

    if (wasDisliked) {
      setIsDisliked(false);
      setIsLiked(wasLiked);
      setDislikeCount(baseDislikes);
      setLikeCount(baseLikes + (wasLiked ? 1 : 0));
      localStorage.setItem(`${key}_isDisliked`, 'false');
    } else {
      setIsDisliked(true);
      setIsLiked(false);
      setDislikeCount(baseDislikes + 1);
      setLikeCount(baseLikes);
      localStorage.setItem(`${key}_isDisliked`, 'true');
      localStorage.setItem(`${key}_isLiked`, 'false');
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Mobile swipe handlers for modal
  const handleModalHeaderTouchStart = (e) => {
    if (window.innerWidth <= 768) {
      e.stopPropagation();
      const touchY = e.touches[0].clientY;
      modalStartYRef.current = touchY;
      isDraggingRef.current = true;
      setIsDragging(true);
      setModalStartY(touchY);
      setModalCurrentY(touchY);
    }
  };

  const handleModalTouchEnd = (e) => {
    if (window.innerWidth <= 768 && isDragging) {
      e.stopPropagation();
      const deltaY = modalCurrentY - modalStartY;
      const screenHeight = window.innerHeight;
      const threshold = screenHeight * 0.1; // 10% of screen
      
      if (deltaY > threshold) {
        setShowDescriptionModal(false);
      }
      
      isDraggingRef.current = false;
      setIsDragging(false);
      setModalCurrentY(0);
      setModalStartY(0);
    }
  };

  const movieVideo = getMovieVideo();
  const descriptionText = getDescriptionText();
  const descriptionData = getDescriptionData();
  const isNewFormat = descriptionData !== null;

  const bgImageUrl = `${process.env.PUBLIC_URL || ''}/img/photo_2026-02-19_21-28-29.jpg`;

  return (
    <div className="movie-detail">
      <div className="movie-detail-bg-block">
        <div
          className="movie-detail-bg"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.6) 40%, rgba(0, 0, 0, 0.9) 80%, rgba(0, 0, 0, 1) 100%), url("${bgImageUrl}")`,
          }}
        />
        <div className="movie-detail-container">
          <div className="movie-detail-content">
          <div className="movie-detail-image-block">
            <div className="movie-detail-image">
              {movieVideo ? (
                <div className="movie-detail-video-wrapper">
                  <ShareButton movie={movie} />
                  <video 
                    ref={videoRef}
                    src={movieVideo} 
                    alt={getMovieTitle()}
                    className="movie-detail-video"
                    playsInline
                    autoPlay
                    muted={isMuted}
                    loop
                  />
                  <div className="movie-detail-video-controls">
                    <button 
                      className="video-control-btn mute-btn"
                      onClick={toggleMute}
                      aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                          <line x1="23" y1="9" x2="17" y2="15" />
                          <line x1="17" y1="9" x2="23" y2="15" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="movie-detail-video-placeholder">
                  <span>Video topilmadi</span>
                </div>
              )}
            </div>
          </div>

          <div className="movie-detail-info-block">
            <div className="movie-detail-info">
              {movie.titleImg ? (
                <div className="movie-detail-title-img-wrapper">
                  <img
                    src={movie.titleImg[contentLang] || movie.titleImg.uz || movie.titleImg.ru}
                    alt={getMovieTitle()}
                    className="movie-detail-title-img"
                  />
                  <h1 className="movie-detail-title movie-detail-title-sr-only">{getMovieTitle()}</h1>
                </div>
              ) : (
                <h1 className="movie-detail-title">{getMovieTitle()}</h1>
              )}

              <div className="movie-detail-specs">
                {movie.specs && (
                  <ScrollTouch className="movie-detail-specs-container">
                    <div className="movie-detail-spec-item">
                      <span className="movie-detail-spec-label">{t('detail.duration')}</span>
                      <span className="movie-detail-spec-value">{movie.specs.duration} min</span>
                    </div>
                    <div className="movie-detail-spec-item">
                      <span className="movie-detail-spec-label">{t('detail.ageRating')}</span>
                      <span className="movie-detail-spec-value">{movie.specs.ageRating}</span>
                    </div>
                    <div className="movie-detail-spec-item">
                      <span className="movie-detail-spec-label">{t('detail.year')}</span>
                      <span className="movie-detail-spec-value">{movie.specs.year}</span>
                    </div>
                    {movie.specs.countries && movie.specs.countries.length > 0 && (
                      <div className="movie-detail-spec-item">
                        <span className="movie-detail-spec-label">{t('detail.countries')}</span>
                        <span className="movie-detail-spec-value">{movie.specs.countries.join(', ')}</span>
                      </div>
                    )}
                    {movie.specs.languages && movie.specs.languages.length > 0 && (
                      <div className="movie-detail-spec-item">
                        <span className="movie-detail-spec-label">{t('detail.languages')}</span>
                        <span className="movie-detail-spec-value">{movie.specs.languages.join(', ')}</span>
                      </div>
                    )}
                  </ScrollTouch>
                )}
              </div>

              <div className="movie-detail-genre">
                <span className="movie-detail-genre-label">{t('detail.genre')}:</span>
                <div className="movie-detail-genres">
                  {getMovieGenres().map((genre, index) => (
                    <span key={index} className="movie-detail-genre-badge">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              <ScrollTouch className="movie-detail-actions">
                <button
                  className={`movie-detail-action-btn movie-detail-action-btn--like ${isLiked ? 'active' : ''}`}
                  onClick={handleLike}
                  aria-label="Like"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                  </svg>
                  <span className="movie-detail-action-count">{formatActionCount(likeCount)}</span>
                </button>

                <button
                  className={`movie-detail-action-btn movie-detail-action-btn--dislike ${isDisliked ? 'active' : ''}`}
                  onClick={handleDislike}
                  aria-label="Dislike"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill={isDisliked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                  </svg>
                  <span className="movie-detail-action-count">{formatActionCount(dislikeCount)}</span>
                </button>

                <button
                  className={`movie-detail-action-btn movie-detail-action-btn-wishlist ${isInWishlist(movie.id) ? 'active' : ''}`}
                  onClick={() => toggleWishlist(movie.id)}
                  aria-label="Sevimlilarga qo'shish"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill={isInWishlist(movie.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                </button>

                <button
                  className="movie-detail-action-btn movie-detail-action-btn-comment"
                  onClick={() => commentsModalRef.current?.openModal()}
                  aria-label={i18n.language === 'uz' ? 'Izohlar' : 'Комментарии'}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span className="movie-detail-action-count">{formatActionCount(commentsCount)}</span>
                </button>
              </ScrollTouch>

              <div className="movie-detail-rating">
                {movie.category !== 'anonslar' && movie.rating != null && movie.rating !== '' && movie.rating !== 'none' && (
                  <div className="movie-detail-rating-item">
                    <img src="/img/photo_2026-02-16_20-30-31_preview_rev_1.png" alt="Rating" className="movie-detail-rating-logo" />
                    <span className="movie-detail-rating-value">{movie.rating}</span>
                  </div>
                )}
                {movie.ratingImdb != null && movie.ratingImdb !== '' && movie.ratingImdb !== 'none' && (
                  <div className="movie-detail-rating-item">
                    <img src="/img/imdb.jpg" alt="IMDb" className="movie-detail-rating-logo" />
                    <span className="movie-detail-rating-value">{movie.ratingImdb}</span>
                  </div>
                )}
                {movie.ratingKinopoisk != null && movie.ratingKinopoisk !== '' && movie.ratingKinopoisk !== 'none' && (
                  <div className="movie-detail-rating-item">
                    <img src="/img/kinopoisk.jpg" alt="Kinopoisk" className="movie-detail-rating-logo" />
                    <span className="movie-detail-rating-value">{movie.ratingKinopoisk}</span>
                  </div>
                )}
                {movie.ratingNetflix != null && movie.ratingNetflix !== '' && movie.ratingNetflix !== 'none' && (
                  <div className="movie-detail-rating-item">
                    <img src="/img/netflix.jpg" alt="Netflix" className="movie-detail-rating-logo" />
                    <span className="movie-detail-rating-value">{movie.ratingNetflix}</span>
                  </div>
                )}
              </div>

              <div className="movie-detail-buttons">
                <button
                  className="movie-detail-btn movie-detail-btn-primary"
                  onClick={() => {
                    setSelectedVideoUrl(null);
                    setShowWatchModal(true);
                  }}
                >
                  {t('detail.watch')}
                </button>
                <button
                  className="movie-detail-btn movie-detail-btn-secondary"
                  onClick={() => setShowTrailerModal(true)}
                >
                  {t('detail.trailer')}
                </button>
              </div>

              <div className="movie-detail-description">
                <div className="movie-detail-description-header">
                  <h3>
                    {i18n.language === 'uz' ? 'Film haqida qisqacha' : 'Кратко о фильме'}
                  </h3>
                </div>
                
                <div className="movie-detail-description-text">
                  <p className="movie-detail-description-preview">
                    {descriptionText.length > 150 ? `${descriptionText.substring(0, 150)}...` : descriptionText}
                  </p>
                  <button 
                    className="movie-detail-description-more-btn"
                    onClick={() => setShowDescriptionModal(true)}
                  >
                    {i18n.language === 'uz' ? 'Batafsil' : 'Подробнее'}
                  </button>
                </div>
              </div>

              {movie?.seasons?.length > 0 && (() => {
                const currentSeason = selectedSeason != null
                  ? movie.seasons?.find((s) => s.seasonNumber === selectedSeason)
                  : movie.seasons?.[0];
                const hasUzEpisodes = currentSeason?.episodes?.some((ep) => ep.uz && ep.uz !== 'none');
                const hasRuEpisodes = currentSeason?.episodes?.some((ep) => ep.ru && ep.ru !== 'none');
                return (
                <div className="movie-detail-seasons">
                  <div className="movie-detail-seasons-header">
                    <div className="movie-detail-seasons-tabs">
                      {hasUzEpisodes && (
                        <button
                          className={`movie-detail-seasons-tab ${seasonsLang === 'uz' ? 'active' : ''}`}
                          onClick={() => setSeasonsLang('uz')}
                        >
                          UZ
                        </button>
                      )}
                      {hasRuEpisodes && (
                        <button
                          className={`movie-detail-seasons-tab ${seasonsLang === 'ru' ? 'active' : ''}`}
                          onClick={() => setSeasonsLang('ru')}
                        >
                          RU
                        </button>
                      )}
                    </div>
                    <div className="movie-detail-season-buttons">
                      <ScrollTouch key={i18n.language} className="movie-detail-season-buttons-scroll">
                        {movie.seasons?.map((season) => (
                          <button
                            key={`${season.seasonNumber}-${i18n.language}`}
                            className={`movie-detail-season-btn ${selectedSeason === season.seasonNumber ? 'active' : ''}`}
                            onClick={() => setSelectedSeason(season.seasonNumber)}
                          >
                            {season.title ? (season.title[i18n.language] || season.title.uz || season.title.ru) : (i18n.language === 'uz' ? `Mavsum ${season.seasonNumber}` : `Сезон ${season.seasonNumber}`)}
                          </button>
                        ))}
                      </ScrollTouch>
                    </div>
                  </div>
                  <div className="movie-detail-season-block">
                    {selectedSeason != null && movie.seasons?.filter((s) => s.seasonNumber === selectedSeason)
                      ?.map((season) => (
                        <ScrollTouch key={season.seasonNumber} className="movie-detail-episodes-scroll">
                          {(season.episodes || []).map((ep, epIndex) => {
                            const videoSrc = ep[seasonsLang];
                            if (!videoSrc || videoSrc === 'none') return null;
                            return (
                              <div
                                key={epIndex}
                                className="movie-detail-episode-item"
                                onClick={() => {
                                  setSelectedVideoUrl(videoSrc);
                                  setShowWatchModal(true);
                                }}
                                onMouseEnter={(e) => {
                                  const v = e.currentTarget.querySelector('video');
                                  if (v) v.play().catch(() => {});
                                }}
                                onMouseLeave={(e) => {
                                  const v = e.currentTarget.querySelector('video');
                                  if (v) { v.pause(); v.currentTime = 0; }
                                }}
                              >
                                <video
                                  src={videoSrc}
                                  preload="metadata"
                                  muted
                                  loop
                                  playsInline
                                  className="movie-detail-episode-video"
                                />
                                <span className="movie-detail-episode-number">{epIndex + 1}</span>
                              </div>
                            );
                          })}
                        </ScrollTouch>
                      ))}
                  </div>
                </div>
                );
              })()}

              {movie?.actors?.length > 0 && (() => {
                if (actorsLoading) {
                  return (
                    <div className="movie-detail-actors">
                      <h3 className="movie-detail-actors-title">
                        {i18n.language === 'uz' ? 'Aktyorlar' : 'Актеры'}
                      </h3>
                      <div className="movie-detail-actors-scroll">
                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'nowrap', overflow: 'hidden' }}>
                          <LoaderSkeleton variant="actor-item" width={80} height={100} />
                          <LoaderSkeleton variant="actor-item" width={80} height={100} />
                          <LoaderSkeleton variant="actor-item" width={80} height={100} />
                          <LoaderSkeleton variant="actor-item" width={80} height={100} />
                          <LoaderSkeleton variant="actor-item" width={80} height={100} />
                        </div>
                      </div>
                    </div>
                  );
                }
                if (movieActors.length === 0) return null;
                return (
                  <div className="movie-detail-actors">
                    <h3 className="movie-detail-actors-title">
                      {i18n.language === 'uz' ? 'Aktyorlar' : 'Актеры'}
                    </h3>
                    <div className="movie-detail-actors-scroll">
                      <ScrollTouch className="movie-detail-actors-scroll-inner">
                      {movieActors.map((actor) => (
                        <div
                          key={actor.actorId}
                          className="movie-detail-actor-item"
                          onClick={() => navigate(`/actor/${actor.actorId}`)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && navigate(`/actor/${actor.actorId}`)}
                        >
                          <div className="movie-detail-actor-image">
                            <img src={actor.image} alt={actor.name[contentLang] || actor.name.uz} />
                          </div>
                          <div className="movie-detail-actor-info">
                            <span className="movie-detail-actor-name">
                              {actor.name[contentLang] || actor.name.uz || actor.name.ru}
                            </span>
                            <p className="movie-detail-actor-desc">
                              {actor.info?.[contentLang] || actor.info?.uz || actor.info?.ru || ''}
                            </p>
                          </div>
                        </div>
                      ))}
                      </ScrollTouch>
                    </div>
                  </div>
                );
              })()}

              <MovieComments
                ref={commentsModalRef}
                movieId={movie.id}
                onCountChange={setCommentsCount}
              />
            </div>
          </div>
        </div>
      </div>
      </div>
      <div className="movie-detail-container movie-detail-similar-wrapper">
        <SimilarMovies currentMovie={movie} />
      </div>

      {showTrailerModal && (
        <TrailerModal
          movie={movie}
          onClose={() => setShowTrailerModal(false)}
        />
      )}

      {showWatchModal && (
        <WatchModal
          movie={movie}
          videoUrl={selectedVideoUrl}
          onClose={() => {
            setShowWatchModal(false);
            setSelectedVideoUrl(null);
          }}
        />
      )}

      {showDescriptionModal && (
        <div 
          className={`movie-detail-description-modal ${isDragging ? 'dragging' : ''}`}
          ref={modalRef}
        >
          <div 
            className="movie-detail-description-modal-overlay" 
            onClick={() => {
              if (window.innerWidth > 768) {
                setShowDescriptionModal(false);
              }
            }}
          ></div>
          <div 
            className="movie-detail-description-modal-content"
            style={window.innerWidth <= 768 && isDragging && modalCurrentY > modalStartY ? {
              transform: `translateY(${modalCurrentY - modalStartY}px)`
            } : {}}
          >
            <div 
              ref={modalHeaderRef}
              className="movie-detail-description-modal-header"
              onTouchStart={handleModalHeaderTouchStart}
              onTouchEnd={handleModalTouchEnd}
            >
              <h3>
                {i18n.language === 'uz' ? 'Film haqida qisqacha' : 'Кратко о фильме'}
              </h3>
              <button 
                className="movie-detail-description-modal-close"
                onClick={() => setShowDescriptionModal(false)}
                aria-label="Close"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
            </div>
            <div className="movie-detail-description-modal-body">
              {isNewFormat ? (
                <>
                  <div className="movie-detail-description-modal-text">
                    <p>{descriptionText}</p>
                  </div>
                  <div className="movie-detail-description-modal-info">
                    <div className="movie-detail-description-info-item">
                      <span className="movie-detail-description-label">
                        {i18n.language === 'uz' ? 'Yil' : 'Год'}
                      </span>
                      <span className="movie-detail-description-value">{descriptionData.year || '-'}</span>
                    </div>
                    <div className="movie-detail-description-info-item">
                      <span className="movie-detail-description-label">
                        {i18n.language === 'uz' ? 'Davlat' : 'Страна'}
                      </span>
                      <span className="movie-detail-description-value">{descriptionData.country || '-'}</span>
                    </div>
                    <div className="movie-detail-description-info-item">
                      <span className="movie-detail-description-label">
                        {t('detail.duration')}
                      </span>
                      <span className="movie-detail-description-value">
                        {descriptionData.duration ? `${descriptionData.duration} min` : '-'}
                      </span>
                    </div>
                    <div className="movie-detail-description-info-item">
                      <span className="movie-detail-description-label">
                        {i18n.language === 'uz' ? 'Janr' : 'Жанр'}
                      </span>
                      <span className="movie-detail-description-value">
                        {descriptionData.genre && Array.isArray(descriptionData.genre) 
                          ? descriptionData.genre.join(', ') 
                          : descriptionData.genre || '-'}
                      </span>
                    </div>
                    <div className="movie-detail-description-info-item">
                      <span className="movie-detail-description-label">
                        {i18n.language === 'uz' ? 'Rejissor' : 'Режиссер'}
                      </span>
                      <span className="movie-detail-description-value">{descriptionData.director || '-'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="movie-detail-description-modal-text">
                  <p>{descriptionText}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetail;