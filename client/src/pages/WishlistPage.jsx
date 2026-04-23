import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWishlist } from '../context/WishlistContext';
import { useLoading } from '../context/LoadingContext';
import { useMoviesCatalog } from '../context/MoviesCatalogContext';
import Movies from '../components/Movies/Movies';
import LoaderSkeleton from '../components/LoaderSkeleton/LoaderSkeleton';
import './WishlistPage.css';

const WishlistPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { wishlistIds } = useWishlist();
  const { wishlistLoading, setLoading } = useLoading();
  const { allMovies } = useMoviesCatalog();

  const wishlistMovies = allMovies.filter((m) => wishlistIds.includes(m.id));
  const isEmpty = wishlistMovies.length === 0;

  useEffect(() => {
    setLoading('wishlist', true);
    const timer = setTimeout(() => setLoading('wishlist', false), 500);
    return () => clearTimeout(timer);
  }, [setLoading]);

  if (isEmpty) {
    return (
      <div className="wishlist-page wishlist-page--empty">
        <div className="wishlist-empty">
          {wishlistLoading ? (
            <LoaderSkeleton variant="wishlist-empty-img" className="wishlist-empty-img-skeleton" width={200} height={200} />
          ) : (
            <img
              src="/img/wishlist_preview_rev_1.png"
              alt={t('wishlist.emptyText')}
              className="wishlist-empty-img"
            />
          )}
          {!wishlistLoading && (
            <>
              <p className="wishlist-empty-text">
                {t('wishlist.emptyText')}
              </p>
              <button
                className="wishlist-empty-btn"
                onClick={() => navigate('/')}
              >
                {t('wishlist.goToHome')}
              </button>
            </>
          )}
          {wishlistLoading && (
            <LoaderSkeleton variant="wishlist-empty-btn" className="wishlist-empty-btn-skeleton" width={160} height={44} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <Movies
        sectionType="wishlist"
        limit={null}
        filteredMovies={wishlistMovies}
        hideHeader
        isLoading={wishlistLoading}
      />
    </div>
  );
};

export default WishlistPage;
