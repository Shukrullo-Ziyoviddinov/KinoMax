import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMoviesCatalog } from '../api/moviesCatalogApi';

const EMPTY_CATALOG = {
  allMovies: [],
  recommendedMovies: [],
  sections: {},
};

const MoviesCatalogContext = createContext({
  ...EMPTY_CATALOG,
  isLoading: true,
  error: null,
});

export const MoviesCatalogProvider = ({ children }) => {
  const [catalog, setCatalog] = useState(EMPTY_CATALOG);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadCatalog = async () => {
      try {
        setIsLoading(true);
        const data = await fetchMoviesCatalog();
        if (isMounted) setCatalog(data);
      } catch (err) {
        console.error("[MoviesCatalog] API so‘rovi muvaffaqiyatsiz:", err?.message || err);
        if (isMounted) {
          setCatalog(EMPTY_CATALOG);
          setError(err);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      ...catalog,
      isLoading,
      error,
    }),
    [catalog, error, isLoading]
  );

  return <MoviesCatalogContext.Provider value={value}>{children}</MoviesCatalogContext.Provider>;
};

export const useMoviesCatalog = () => useContext(MoviesCatalogContext);
