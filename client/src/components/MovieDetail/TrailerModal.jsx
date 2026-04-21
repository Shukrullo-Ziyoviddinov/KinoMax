


import React, { useRef, useState, useEffect, useCallback } from 'react';
import { formatActionCount } from '../../utils/utils';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import SimilarTrailers from './SimilarTrailers';
import LoaderSkeleton from '../LoaderSkeleton/LoaderSkeleton';
import './TrailerModal.css';

const TrailerModalBackIcon = () => (
  <svg
    className="trailer-modal-close-icon"
    width={22}
    height={22}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
  </svg>
);

const TrailerModal = ({ movie, onClose }) => {
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const getTrailers = () => {
    if (movie.trailersVideo && Array.isArray(movie.trailersVideo)) {
      return movie.trailersVideo;
    }
    // Fallback for old structure
    if (movie.trailers && Array.isArray(movie.trailers)) {
      return movie.trailers.map(t => ({
        id: t.id,
        trailers: { uz: t.url, ru: t.url },
        title: { uz: t.title, ru: t.title }
      }));
    }
    return [];
  };
  const trailers = getTrailers();
  const [selectedTrailer, setSelectedTrailer] = useState(trailers[0] || null);

  const getTrailerKey = (trailer) => {
    if (!trailer) return null;
    const movieId = trailer.movieId || movie?.id;
    return `${movieId}-${trailer.id}`;
  };

  const getBaseCounts = (trailer) => ({
    like: parseInt(trailer.like, 10) || 0,
    dislike: parseInt(trailer.dislike, 10) || 0
  });

  const loadTrailerReactions = (trailer) => {
    if (!trailer) return { like: 0, dislike: 0, userReaction: null };
    const key = getTrailerKey(trailer);
    if (!key) return { like: 0, dislike: 0, userReaction: null };
    
    const base = getBaseCounts(trailer);
    const stored = localStorage.getItem(`trailer_reactions_${key}`);
    let userReaction = null;
    if (stored) {
      try {
        const data = JSON.parse(stored);
        userReaction = data.userReaction || null;
      } catch (_) {
        userReaction = null;
      }
    }
    
    const like = base.like + (userReaction === 'like' ? 1 : 0);
    const dislike = base.dislike + (userReaction === 'dislike' ? 1 : 0);
    return { like, dislike, userReaction };
  };

  const [trailerReactions, setTrailerReactions] = useState(() => {
    const reactions = {};
    trailers.forEach(trailer => {
      const key = getTrailerKey(trailer);
      if (key) {
        reactions[key] = loadTrailerReactions(trailer);
      }
    });
    return reactions;
  });

  const updateTrailerReaction = (trailer, type) => {
    if (!trailer) return;
    const key = getTrailerKey(trailer);
    if (!key) return;

    const base = getBaseCounts(trailer);
    const current = loadTrailerReactions(trailer);
    const currentReaction = current.userReaction;
    let newReaction = null;

    if (type === 'like') {
      newReaction = currentReaction === 'like' ? null : 'like';
    } else {
      newReaction = currentReaction === 'dislike' ? null : 'dislike';
    }

    const newLike = base.like + (newReaction === 'like' ? 1 : 0);
    const newDislike = base.dislike + (newReaction === 'dislike' ? 1 : 0);

    const updated = { like: newLike, dislike: newDislike, userReaction: newReaction };

    setTrailerReactions(prev => ({ ...prev, [key]: updated }));
    localStorage.setItem(`trailer_reactions_${key}`, JSON.stringify({ userReaction: newReaction }));
  };

  const handleLike = (trailer) => updateTrailerReaction(trailer, 'like');
  const handleDislike = (trailer) => updateTrailerReaction(trailer, 'dislike');

  const getReactionCounts = (trailer) => {
    if (!trailer) return { like: 0, dislike: 0 };
    const key = getTrailerKey(trailer);
    if (!key) return { like: 0, dislike: 0 };
    const reactions = trailerReactions[key] || loadTrailerReactions(trailer);
    return { like: reactions.like || 0, dislike: reactions.dislike || 0 };
  };

  const getUserReaction = (trailer) => {
    if (!trailer) return null;
    const key = getTrailerKey(trailer);
    if (!key) return null;
    const reactions = trailerReactions[key] || loadTrailerReactions(trailer);
    return reactions.userReaction || null;
  };

  const handleTrailerSelect = (trailer) => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setSelectedTrailer(trailer);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setShowControls(true);
    showControlsRef.current = true;
    
    if (trailer) {
      const key = getTrailerKey(trailer);
      if (key) {
        setTrailerReactions(prev => {
          if (!prev[key]) {
            return { ...prev, [key]: loadTrailerReactions(trailer) };
          }
          return prev;
        });
      }
    }
  };

  const videoRef = useRef(null);
  const videoWrapperRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [trailerLoading, setTrailerLoading] = useState(true);

  useEffect(() => {
    setTrailerLoading(true);
    const timer = setTimeout(() => setTrailerLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // useRef - stale closure muammosini hal qilish uchun
  const hideControlsTimeoutRef = useRef(null);
  const isPlayingRef = useRef(false);
  const showControlsRef = useRef(true);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const playbackSpeedRef = useRef(1);

  const speedOptions = [1, 1.5, 2];

  // Modal ochilganda body scroll bloklash (qotish muammosini bartaraf etish)
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  // onMouseMove throttling — har harakatda setState chaqirilmasin (qotish oldini olish)
  const lastMouseMoveRef = useRef(0);
  const throttledShowControls = () => {
    const now = Date.now();
    if (now - lastMouseMoveRef.current < 150) return;
    lastMouseMoveRef.current = now;
    showControlsWithDelay();
  };

  // Ref larni state bilan sinxronlashtirish
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    showControlsRef.current = showControls;
  }, [showControls]);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  const clearHideTimeout = useCallback(() => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
      hideControlsTimeoutRef.current = null;
    }
  }, []);

  const startHideTimeout = useCallback(() => {
    clearHideTimeout();
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
      showControlsRef.current = false;
      setShowSpeedMenu(false);
    }, 4000);
  }, [clearHideTimeout]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlayingRef.current) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {}); // play() interrupted by pause() — expected
      }
    }
    showControlsWithDelay();
  };

  const handleBack10 = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
    showControlsWithDelay();
  };

  const handleForward10 = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10);
    }
    showControlsWithDelay();
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
      if (newMuted) {
        videoRef.current.volume = 0;
      } else {
        videoRef.current.volume = volume || 0.5;
        setVolume(volume || 0.5);
      }
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      try {
        videoRef.current.playbackRate = speed;
      } catch (error) {
        console.error('Error setting playback rate:', error);
      }
    }
    setShowSpeedMenu(false);
    showControlsWithDelay();
  };

  const handleFullscreen = () => {
    if (!videoWrapperRef.current) return;

    const isNativeFullscreen = () => Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );

    const requestNativeFullscreen = async () => {
      const wrapper = videoWrapperRef.current;
      const video = videoRef.current;

      try {
        if (wrapper.requestFullscreen) {
          await wrapper.requestFullscreen();
          return true;
        }
        if (wrapper.webkitRequestFullscreen) {
          wrapper.webkitRequestFullscreen();
          return true;
        }
        if (wrapper.mozRequestFullScreen) {
          wrapper.mozRequestFullScreen();
          return true;
        }
        if (wrapper.msRequestFullscreen) {
          wrapper.msRequestFullscreen();
          return true;
        }
        if (video && video.webkitEnterFullscreen) {
          video.webkitEnterFullscreen();
          return true;
        }
      } catch (_) {
        return false;
      }

      return false;
    };

    const exitNativeFullscreen = async () => {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          return true;
        }
        if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
          return true;
        }
        if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
          return true;
        }
        if (document.msExitFullscreen) {
          document.msExitFullscreen();
          return true;
        }
      } catch (_) {
        return false;
      }

      return false;
    };

    const toggleFullscreen = async () => {
      if (isNativeFullscreen()) {
        const exited = await exitNativeFullscreen();
        if (!exited) setIsPseudoFullscreen(false);
        return;
      }

      if (isPseudoFullscreen) {
        setIsPseudoFullscreen(false);
        return;
      }

      const entered = await requestNativeFullscreen();
      if (!entered) {
        // Telegram WebApp kabi brauzerlarda Fullscreen API bloklansa fallback.
        setIsPseudoFullscreen(true);
      }
    };

    toggleFullscreen().catch((error) => {
      console.error('Error toggling fullscreen:', error);
      setIsPseudoFullscreen((prev) => !prev);
    });
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
    const totalSeconds = Math.floor(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setDuration(videoRef.current.duration);
      videoRef.current.playbackRate = playbackSpeed;
    }
  };

  const updateProgress = (clientX, progressContainer) => {
    if (videoRef.current && videoRef.current.duration && !isNaN(videoRef.current.duration) && progressContainer) {
      const rect = progressContainer.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const percent = Math.max(0, Math.min(1, clickX / rect.width));
      const newTime = percent * videoRef.current.duration;
      setPreviewTime(newTime);
      return newTime;
    }
    return 0;
  };

  const handleProgressClick = (e) => {
    e.stopPropagation();
    const newTime = updateProgress(e.clientX, e.currentTarget);
    if (videoRef.current && newTime >= 0) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setPreviewTime(0);
    }
  };

  const handleProgressMouseDown = (e) => { e.stopPropagation(); setIsDragging(true); updateProgress(e.clientX, e.currentTarget); };
  const handleProgressMouseMove = (e) => { if (isDragging) { e.stopPropagation(); updateProgress(e.clientX, e.currentTarget); } };
  const handleProgressMouseUp = (e) => {
    if (isDragging) {
      e.stopPropagation();
      if (videoRef.current && previewTime >= 0) { videoRef.current.currentTime = previewTime; setCurrentTime(previewTime); setPreviewTime(0); }
      setIsDragging(false);
    }
  };
  const handleProgressTouchStart = (e) => { e.stopPropagation(); setIsDragging(true); updateProgress(e.touches[0].clientX, e.currentTarget); };
  const handleProgressTouchMove = (e) => { e.stopPropagation(); if (isDragging) updateProgress(e.touches[0].clientX, e.currentTarget); };
  const handleProgressTouchEnd = (e) => {
    e.stopPropagation();
    if (isDragging && videoRef.current && previewTime >= 0) { videoRef.current.currentTime = previewTime; setCurrentTime(previewTime); setPreviewTime(0); }
    setIsDragging(false);
  };

  const getProgressPercent = () => {
    if (duration > 0 && !isNaN(duration) && currentTime >= 0 && !isNaN(currentTime)) return Math.min(100, Math.max(0, (currentTime / duration) * 100));
    return 0;
  };

  const getRemainingTime = () => {
    if (duration > 0 && !isNaN(duration) && currentTime >= 0 && !isNaN(currentTime)) return Math.max(0, duration - currentTime);
    return 0;
  };

  const showControlsWithDelay = () => {
    setShowControls(true);
    showControlsRef.current = true;
    if (isPlayingRef.current) {
      startHideTimeout();
    } else {
      clearHideTimeout();
    }
  };

  useEffect(() => {
    if (isPlaying) {
      setShowControls(true);
      showControlsRef.current = true;
      startHideTimeout();
    } else {
      setShowControls(true);
      showControlsRef.current = true;
      clearHideTimeout();
    }
  }, [isPlaying, startHideTimeout, clearHideTimeout]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const nativeActive = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(nativeActive || isPseudoFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    handleFullscreenChange();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      clearHideTimeout();
    };
  }, [clearHideTimeout, isPseudoFullscreen]);

  useEffect(() => {
    if (!isPseudoFullscreen) return undefined;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsPseudoFullscreen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isPseudoFullscreen]);

  useEffect(() => {
    if (!selectedTrailer) return;
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    let attempts = 0;
    const maxAttempts = 50; // 5 soniya — cheksiz interval qotish oldini olish
    const checkDuration = setInterval(() => {
      attempts++;
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
        if (video.playbackRate !== playbackSpeedRef.current) {
          video.playbackRate = playbackSpeedRef.current;
        }
        clearInterval(checkDuration);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkDuration);
      }
    }, 100);

    return () => {
      clearInterval(checkDuration);
      if (video) video.pause();
    };
  }, [selectedTrailer, contentLang]);

  // Mobil: video ustiga bosilganda controls toggle
  const videoTapRef = useRef({ x: 0, y: 0, time: 0 });

  const handleVideoWrapperTouchStart = (e) => {
    if (!('ontouchstart' in window)) return;
    if (e.target.closest('.trailer-modal-control-btn') || e.target.closest('.trailer-modal-bottom-controls') || e.target.closest('input')) return;
    const touch = e.touches[0];
    videoTapRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleVideoWrapperTouchEnd = (e) => {
    if (!('ontouchstart' in window)) return;
    if (e.target.closest('.trailer-modal-control-btn') || e.target.closest('.trailer-modal-bottom-controls') || e.target.closest('input')) return;
    const touch = e.changedTouches?.[0];
    if (!touch) return;
    const { x, y, time } = videoTapRef.current;
    const dx = Math.abs(touch.clientX - x);
    const dy = Math.abs(touch.clientY - y);
    const dt = Date.now() - time;
    if (dx < 20 && dy < 20 && dt < 300) {
      e.preventDefault();
      // showControlsRef.current — joriy qiymatni ref orqali o'qiymiz (stale closure yo'q)
      if (showControlsRef.current) {
        // Yashir
        clearHideTimeout();
        setShowControls(false);
        showControlsRef.current = false;
      } else {
        // Ko'rsat
        setShowControls(true);
        showControlsRef.current = true;
        if (isPlayingRef.current) {
          startHideTimeout();
        }
      }
    }
  };

  const handleVideoClick = (e) => {
    e.stopPropagation();
    if (e.target.closest('button') || e.target.closest('input')) return;
    handlePlayPause();
  };

  if (!trailers || trailers.length === 0) {
    return (
      <div className="trailer-modal-overlay" onClick={onClose}>
        <div className="trailer-modal" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="trailer-modal-close" onClick={onClose} aria-label="Close">
            <TrailerModalBackIcon />
          </button>
          <div className="trailer-modal-no-trailers">
            <p>No trailers available</p>
          </div>
        </div>
      </div>
    );
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="trailer-modal-overlay" onClick={handleOverlayClick}>
      <div className="trailer-modal" onClick={(e) => e.stopPropagation()}>
        {trailerLoading ? (
          <LoaderSkeleton variant="trailer-modal-close" className="trailer-modal-close-skeleton" />
        ) : (
          <button type="button" className="trailer-modal-close" onClick={onClose} aria-label="Close">
            <TrailerModalBackIcon />
          </button>
        )}
        
        <div className="trailer-modal-content">
          <div className="trailer-modal-main">
            {(selectedTrailer || trailerLoading) && (
              <div 
                className={`trailer-modal-video-wrapper ${isPseudoFullscreen ? 'trailer-modal-video-wrapper--pseudo-fullscreen' : ''}`}
                ref={videoWrapperRef}
                onMouseMove={('ontouchstart' in window) ? undefined : throttledShowControls}
                onMouseLeave={('ontouchstart' in window) ? undefined : () => isPlaying && setShowControls(false)}
                onTouchStart={handleVideoWrapperTouchStart}
                onTouchEnd={handleVideoWrapperTouchEnd}
              >
                {trailerLoading ? (
                  <LoaderSkeleton variant="trailer-modal-video" className="trailer-modal-video-skeleton" />
                ) : (
                  <video
                    ref={videoRef}
                    src={selectedTrailer?.trailers?.[contentLang] || selectedTrailer?.trailers?.uz || selectedTrailer?.trailers?.ru || ''}
                    preload="auto"
                    playsInline
                    className="trailer-modal-video"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onLoadedData={handleLoadedMetadata}
                    onCanPlay={handleLoadedMetadata}
                    onClick={handleVideoClick}
                    onRateChange={(e) => {
                      if (e.target.playbackRate !== playbackSpeed) console.log('Rate mismatch! Expected:', playbackSpeed, 'Got:', e.target.playbackRate);
                    }}
                  />
                )}
                
                {trailerLoading ? (
                  <>
                    <div className="trailer-modal-controls-overlay show">
                      <div className="trailer-modal-controls-center">
                        <LoaderSkeleton variant="trailer-modal-control-btn" />
                        <LoaderSkeleton variant="trailer-modal-control-btn" className="trailer-modal-control-btn-play-skeleton" />
                        <LoaderSkeleton variant="trailer-modal-control-btn" />
                      </div>
                    </div>
                    <div className="trailer-modal-bottom-controls show">
                      <LoaderSkeleton variant="trailer-modal-controls-bar" className="trailer-modal-controls-bar-skeleton" />
                    </div>
                  </>
                ) : (
                <>
                <div className={`trailer-modal-controls-overlay ${showControls ? 'show' : ''}`}>
                  <div className="trailer-modal-controls-center">
                    <button className="trailer-modal-control-btn" onClick={handleBack10} aria-label="Rewind 10 seconds">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                        <text x="8" y="15" fill="white" fontSize="8" fontWeight="bold">10</text>
                      </svg>
                    </button>
                    
                    <button className="trailer-modal-control-btn trailer-modal-control-btn-play" onClick={handlePlayPause} aria-label={isPlaying ? t('player.pause') : t('player.play')}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                        {isPlaying ? (<><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>) : (<polygon points="5 3 19 12 5 21 5 3"/>)}
                      </svg>
                    </button>
                    
                    <button className="trailer-modal-control-btn" onClick={handleForward10} aria-label="Forward 10 seconds">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
                        <text x="8" y="15" fill="white" fontSize="8" fontWeight="bold">10</text>
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div 
                  className={`trailer-modal-bottom-controls ${showControls ? 'show' : ''}`}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseMove={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <div 
                    className="trailer-modal-progress-container"
                    onClick={(e) => { e.stopPropagation(); handleProgressClick(e); }}
                    onMouseDown={(e) => { e.stopPropagation(); handleProgressMouseDown(e); }}
                    onMouseMove={(e) => { e.stopPropagation(); handleProgressMouseMove(e); }}
                    onMouseUp={(e) => { e.stopPropagation(); handleProgressMouseUp(e); }}
                    onMouseLeave={(e) => { e.stopPropagation(); handleProgressMouseUp(e); }}
                    onTouchStart={(e) => { e.stopPropagation(); handleProgressTouchStart(e); }}
                    onTouchMove={(e) => { e.stopPropagation(); handleProgressTouchMove(e); }}
                    onTouchEnd={(e) => { e.stopPropagation(); handleProgressTouchEnd(e); }}
                  >
                    <div className="trailer-modal-progress-bar">
                      <div className="trailer-modal-progress-filled" style={{ width: `${isDragging ? (previewTime / duration) * 100 : getProgressPercent()}%` }}>
                        <div className="trailer-modal-progress-thumb"></div>
                      </div>
                      {isDragging && (
                        <div className="trailer-modal-preview-tooltip" style={{ left: `${(previewTime / duration) * 100}%` }}>
                          {formatTime(previewTime)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="trailer-modal-controls-bar">
                    <div className="trailer-modal-left-controls">
                      <button className="trailer-modal-icon-btn" onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          {isPlaying ? (<><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>) : (<polygon points="5 3 19 12 5 21 5 3"/>)}
                        </svg>
                      </button>

                      <button className="trailer-modal-icon-btn" onClick={(e) => { e.stopPropagation(); toggleMute(); }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          {isMuted || volume === 0 ? (
                            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                          ) : volume > 0.5 ? (
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                          ) : (
                            <path d="M7 9v6h4l5 5V4l-5 5H7z"/>
                          )}
                        </svg>
                      </button>

                      <input
                        type="range" min="0" max="1" step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => { e.stopPropagation(); handleVolumeChange(e); }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        className="trailer-modal-volume-slider"
                      />

                      <div className="trailer-modal-time-display">
                        <span className="trailer-modal-time-current">{formatTime(currentTime)}</span>
                        <span className="trailer-modal-time-separator"> / </span>
                        <span className="trailer-modal-time-duration">{formatTime(duration)}</span>
                        <span className="trailer-modal-time-remaining"> (-{formatTime(getRemainingTime())})</span>
                      </div>
                    </div>

                    <div className="trailer-modal-right-controls">
                      <div style={{ position: 'relative' }}>
                        <button className="trailer-modal-icon-btn" onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); }} title={`Tezlik: ${playbackSpeed}x`}>
                          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{playbackSpeed}x</span>
                        </button>
                        {showSpeedMenu && (
                          <div className="trailer-modal-speed-menu" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                            {speedOptions.map(speed => (
                              <button
                                key={speed}
                                className={`trailer-modal-speed-option ${playbackSpeed === speed ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); handleSpeedChange(speed); }}
                                onMouseDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                              >
                                {speed}x
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <button className="trailer-modal-icon-btn" onClick={(e) => { e.stopPropagation(); handleFullscreen(); }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          {isFullscreen ? (
                            <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                          ) : (
                            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                </>
                )}
              </div>
            )}
            
            {(selectedTrailer || trailerLoading) && (
              <div className="trailer-modal-controls-info">
                {trailerLoading ? (
                  <>
                    <LoaderSkeleton variant="text" className="trailer-modal-controls-title-skeleton" width="80%" height={24} />
                    <LoaderSkeleton variant="text" className="trailer-modal-controls-text-skeleton" width="100%" height={40} />
                    <div className="trailer-modal-controls-actions" style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                      <LoaderSkeleton variant="trailer-controls-like" width={70} height={36} />
                      <LoaderSkeleton variant="trailer-controls-dislike" width={70} height={36} />
                    </div>
                  </>
                ) : selectedTrailer ? (
                  <>
                    <div className="trailer-modal-controls-title">
                      {selectedTrailer.title?.[contentLang] || selectedTrailer.title?.uz || selectedTrailer.title?.ru || ''}
                    </div>
                    <div className="trailer-modal-controls-text">
                      {selectedTrailer.text?.[contentLang] || selectedTrailer.text?.uz || selectedTrailer.text?.ru || ''}
                    </div>
                    <div className="trailer-modal-controls-actions">
                      <div 
                        className={`trailer-modal-controls-like ${getUserReaction(selectedTrailer) === 'like' ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleLike(selectedTrailer); }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
                        </svg>
                        <span>{formatActionCount(getReactionCounts(selectedTrailer).like)}</span>
                      </div>
                      <div 
                        className={`trailer-modal-controls-dislike ${getUserReaction(selectedTrailer) === 'dislike' ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleDislike(selectedTrailer); }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/>
                        </svg>
                        <span>{formatActionCount(getReactionCounts(selectedTrailer).dislike)}</span>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </div>

          <div className="trailer-modal-sidebar">
            <SimilarTrailers 
              trailerLoading={trailerLoading}
              currentMovie={movie}
              selectedTrailer={selectedTrailer}
              onTrailerSelect={handleTrailerSelect}
              trailerReactions={trailerReactions}
              getTrailerKey={getTrailerKey}
              onLike={handleLike}
              onDislike={handleDislike}
              getReactionCounts={getReactionCounts}
              getUserReaction={getUserReaction}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrailerModal;