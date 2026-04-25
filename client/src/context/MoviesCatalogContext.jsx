import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMoviesCatalog } from '../api/moviesCatalogApi';

const EMPTY_CATALOG = {
  allMovies: [],
  recommendedMovies: [],
  sections: {},
};

const MoviesCatalogContext = createContext({
  ...EMPTY_CATALOG,
  isLoading: true,
  isLoadingMore: false,
  hasMore: false,
  loadMore: async () => {},
  error: null,
});

const mergeUniqueById = (current = [], next = []) => {
  const map = new Map();
  [...current, ...next].forEach((item) => {
    const id = item?.id;
    if (typeof id !== 'undefined') {
      map.set(id, item);
    }
  });
  return Array.from(map.values());
};

const mergeSections = (current = {}, next = {}) => {
  const keys = new Set([...Object.keys(current || {}), ...Object.keys(next || {})]);
  const merged = {};
  keys.forEach((key) => {
    merged[key] = mergeUniqueById(current?.[key] || [], next?.[key] || []);
  });
  return merged;
};

const resolvePageLimit = () => {
  if (typeof window === 'undefined') return 30;
  return window.innerWidth < 768 ? 20 : 30;
};

export const MoviesCatalogProvider = ({ children }) => {
  const [catalog, setCatalog] = useState(EMPTY_CATALOG);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [pageLimit] = useState(resolvePageLimit);

  const loadPage = useCallback(async (targetPage, { append = false } = {}) => {
    const data = await fetchMoviesCatalog({ page: targetPage, limit: pageLimit });
    const nextCatalog = {
      allMovies: data.allMovies || [],
      recommendedMovies: data.recommendedMovies || [],
      sections: data.sections || {},
    };
    const nextMeta = data.meta || {};
    const nextHasMore = Boolean(nextMeta.hasNextPage);

    setCatalog((prev) => {
      if (!append) return nextCatalog;
      return {
        allMovies: mergeUniqueById(prev.allMovies, nextCatalog.allMovies),
        recommendedMovies: mergeUniqueById(prev.recommendedMovies, nextCatalog.recommendedMovies),
        sections: mergeSections(prev.sections, nextCatalog.sections),
      };
    });
    setHasMore(nextHasMore);
    setPage(targetPage);
    setError(null);
  }, [pageLimit]);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;
    try {
      setIsLoadingMore(true);
      await loadPage(page + 1, { append: true });
    } catch (err) {
      console.error("[MoviesCatalog] keyingi sahifa xatoligi:", err?.message || err);
      setError(err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoading, isLoadingMore, loadPage, page]);

  useEffect(() => {
    let isMounted = true;
    const bootstrap = async () => {
      try {
        setIsLoading(true);
        await loadPage(1, { append: false });
      } catch (err) {
        console.error("[MoviesCatalog] API so‘rovi muvaffaqiyatsiz:", err?.message || err);
        if (isMounted) {
          setCatalog(EMPTY_CATALOG);
          setError(err);
          setHasMore(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsBootstrapped(true);
        }
      }
    };
    bootstrap();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isBootstrapped) return undefined;
    const onScroll = () => {
      const threshold = 600;
      const scrollBottom = window.innerHeight + window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      if (scrollBottom >= docHeight - threshold) {
        loadMore();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isBootstrapped, loadMore]);

  const value = useMemo(
    () => ({
      ...catalog,
      isLoading,
      isLoadingMore,
      hasMore,
      loadMore,
      error,
    }),
    [catalog, error, hasMore, isLoading, isLoadingMore, loadMore]
  );

  return <MoviesCatalogContext.Provider value={value}>{children}</MoviesCatalogContext.Provider>;
};

export const useMoviesCatalog = () => useContext(MoviesCatalogContext);
