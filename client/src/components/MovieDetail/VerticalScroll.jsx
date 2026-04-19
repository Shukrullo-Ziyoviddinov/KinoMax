import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import './VerticalScroll.css';

const VerticalScroll = ({ children, className = '' }) => {
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [showScrollbar, setShowScrollbar] = useState(false);
  const scrollableRef = useRef(false);

  const updateThumbAndScrollable = useCallback(() => {
    const container = containerRef.current;
    const scrollbar = scrollRef.current;
    const track = trackRef.current;
    if (!container || !scrollbar || !track) return;

    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const scrollTop = container.scrollTop;
    const maxScroll = scrollHeight - clientHeight;
    const scrollable = maxScroll > 0;

    if (scrollable !== scrollableRef.current) {
      scrollableRef.current = scrollable;
      setShowScrollbar(scrollable);
    }

    if (!scrollable) {
      scrollbar.style.display = 'none';
      return;
    }

    scrollbar.style.display = 'block';
    const trackHeight = track.offsetHeight;
    const thumbHeight = Math.max(20, (clientHeight / scrollHeight) * trackHeight);
    const scrollPercent = maxScroll > 0 ? scrollTop / maxScroll : 0;
    const maxThumbTop = trackHeight - thumbHeight;
    scrollbar.style.top = `${scrollPercent * maxThumbTop}px`;
    scrollbar.style.height = `${thumbHeight}px`;
  }, []);

  const handleMouseDown = (e) => {
    if (!scrollRef.current || !trackRef.current) return;
    e.preventDefault();
    setIsDragging(true);
    const rect = trackRef.current.getBoundingClientRect();
    setStartY(e.clientY - rect.top - scrollRef.current.offsetTop);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current || !scrollRef.current || !trackRef.current) return;
    e.preventDefault();

    const container = containerRef.current;
    const scrollbar = scrollRef.current;
    const track = trackRef.current;
    const trackRect = track.getBoundingClientRect();
    const y = e.clientY - trackRect.top;
    const scrollbarHeight = scrollbar.offsetHeight;
    const trackHeight = track.offsetHeight;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const maxScroll = scrollHeight - clientHeight;

    const scrollbarTop = Math.max(0, Math.min(y - startY, trackHeight - scrollbarHeight));
    const scrollPercent = scrollbarTop / (trackHeight - scrollbarHeight);
    container.scrollTop = scrollPercent * maxScroll;
  }, [isDragging, startY]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (container.scrollHeight > container.clientHeight) {
        e.preventDefault();
        container.scrollTop += e.deltaY;
      }
    };

    container.addEventListener('scroll', updateThumbAndScrollable, { passive: true });
    container.addEventListener('wheel', handleWheel, { passive: false });
    const resizeObserver = new ResizeObserver(() => updateThumbAndScrollable());
    resizeObserver.observe(container);

    requestAnimationFrame(() => updateThumbAndScrollable());

    return () => {
      container.removeEventListener('scroll', updateThumbAndScrollable);
      container.removeEventListener('wheel', handleWheel);
      resizeObserver.disconnect();
    };
  }, [updateThumbAndScrollable]);

  useLayoutEffect(() => {
    updateThumbAndScrollable();
  }, [showScrollbar, updateThumbAndScrollable]);

  return (
    <div
      className={`vertical-scroll-wrapper ${className} ${showScrollbar ? '' : 'vertical-scroll-wrapper--no-track'}`}
    >
      <div className="vertical-scroll-container" ref={containerRef}>
        {children}
      </div>
      <div
        className="vertical-scrollbar-track"
        ref={trackRef}
        aria-hidden={!showScrollbar}
        style={{ display: showScrollbar ? undefined : 'none' }}
      >
        <div
          className="vertical-scrollbar-thumb"
          ref={scrollRef}
          onMouseDown={handleMouseDown}
        />
      </div>
    </div>
  );
};

export default VerticalScroll;
