import React, { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

const WISHLIST_STORAGE_KEY = 'movie_wishlist';

export const WishlistProvider = ({ children }) => {
  const [wishlistIds, setWishlistIds] = useState([]);

  const toId = (movieOrId) => {
    const raw = movieOrId && typeof movieOrId === 'object' ? movieOrId.id : movieOrId;
    const id = Number.parseInt(raw, 10);
    return Number.isNaN(id) ? null : id;
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const normalized = Array.isArray(parsed)
          ? parsed
              .map((item) => toId(item))
              .filter((item) => item !== null)
          : [];
        setWishlistIds(normalized);
      }
    } catch (e) {
      setWishlistIds([]);
    }
  }, []);

  const addToWishlist = (movieOrId) => {
    const id = toId(movieOrId);
    if (id === null) return;
    setWishlistIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const removeFromWishlist = (movieOrId) => {
    const id = toId(movieOrId);
    if (id === null) return;
    setWishlistIds((prev) => {
      const next = prev.filter((x) => x !== id);
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const toggleWishlist = (movieOrId) => {
    const id = toId(movieOrId);
    if (id === null) return;
    setWishlistIds((prev) => {
      const has = prev.includes(id);
      const next = has ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const isInWishlist = (movieOrId) => {
    const id = toId(movieOrId);
    if (id === null) return false;
    return wishlistIds.includes(id);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return ctx;
};
