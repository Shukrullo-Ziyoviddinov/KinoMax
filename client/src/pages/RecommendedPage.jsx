import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { useParams, useLocation, useSearchParams } from 'react-router-dom';
import { useMoviesCatalog } from '../context/MoviesCatalogContext';
import { fetchGenres } from '../api/genresApi';
import { getTopRatedMovies } from '../components/TopRatedContent/TopRatedContent';
import Filters from '../components/Filters';
import Movies from '../components/Movies/Movies';
import './RecommendedPage.css';

const CATEGORY_GENRE_MAP = {
  romantika: ['Romantika', 'Romantik'],
  multfilimlar: ['Multfilim', 'Animatsiya', 'Anime'],
  anime: ['Anime'],
  doramalar: ['Drama'],
  komediya: ['Komediya'],
  jangari: ['Jangari', 'Boevik'],
  horror: ["Qo'rqinchli", 'Horror'],
  sarguzasht: ['Sarguzasht'],
  fantastika: ['Fantastika'],
};

const normalizeFilterValue = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[’ʻʼ`]/g, "'");

const getRatingFilter = (movie, selectedRatingType, selectedRating) => {
  if (selectedRating === null) return true;
  // Anonslar VL (rating) filteriga aralashmaydi - VL tanlanganda anonslar chiqmaydi, boshqa reytinglarda qatnashadi
  if (selectedRatingType === 'rating' && movie.category === 'anonslar') return false;
  const val = movie[selectedRatingType];
  return val != null && val !== '' && val !== 'none' && (val === selectedRating || Number(val) === Number(selectedRating));
};

const getSimilarMovies = (currentMovie, movies) => {
  if (!currentMovie) return [];
  const currentTypeCategory = Array.isArray(currentMovie.typeCategory)
    ? currentMovie.typeCategory.map((tc) => String(tc).toLowerCase().trim())
    : currentMovie.typeCategory
    ? [String(currentMovie.typeCategory).toLowerCase().trim()]
    : [];
  const currentFilterCountry = currentMovie.filterCountry
    ? String(currentMovie.filterCountry).toLowerCase().trim()
    : '';
  return movies.filter((movie) => {
    if (movie.id === currentMovie.id) return false;
    if (!movie.typeCategory && !movie.filterCountry) return false;
    const movieTypeCategory = Array.isArray(movie.typeCategory)
      ? movie.typeCategory.map((tc) => String(tc).toLowerCase().trim())
      : movie.typeCategory
      ? [String(movie.typeCategory).toLowerCase().trim()]
      : [];
    const movieFilterCountry = movie.filterCountry
      ? String(movie.filterCountry).toLowerCase().trim()
      : '';
    const hasMatchingTypeCategory =
      currentTypeCategory.length > 0 &&
      movieTypeCategory.length > 0 &&
      currentTypeCategory.some((ctc) => movieTypeCategory.includes(ctc));
    const hasMatchingFilterCountry =
      currentFilterCountry &&
      movieFilterCountry &&
      currentFilterCountry === movieFilterCountry;
    return hasMatchingTypeCategory || hasMatchingFilterCountry;
  });
};

const RecommendedPage = () => {
  const { categoryId, movieId } = useParams();
  const location = useLocation();
  const { allMovies, recommendedMovies, isLoading: catalogLoading } = useMoviesCatalog();
  const [searchParams] = useSearchParams();
  const genreFromUrl = searchParams.get('genre');
  const [genresConfig, setGenresConfig] = useState([]);
  const getGenresFromUrl = useCallback((g) => {
    if (!g) return [];
    const genreConfig = genresConfig.find(
      (c) => Array.isArray(c.filterGenre) && c.filterGenre.includes(g)
    );
    if (genreConfig) {
      return [...genreConfig.filterGenre];
    }
    return [g];
  }, [genresConfig]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [selectedRatingType, setSelectedRatingType] = useState('rating');
  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedGenres, setSelectedGenres] = useState(() =>
    genreFromUrl
      ? getGenresFromUrl(genreFromUrl)
      : (categoryId && CATEGORY_GENRE_MAP[categoryId]) || []
  );
  const [selectedAge, setSelectedAge] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadGenres = async () => {
      try {
        setGenresLoading(true);
        const data = await fetchGenres();
        if (isMounted) setGenresConfig(data);
      } catch (_error) {
        if (isMounted) setGenresConfig([]);
      } finally {
        if (isMounted) setGenresLoading(false);
      }
    };

    loadGenres();
    return () => {
      isMounted = false;
    };
  }, []);

  useLayoutEffect(() => {
    if (genreFromUrl) {
      setSelectedGenres(getGenresFromUrl(genreFromUrl));
    } else if (categoryId && CATEGORY_GENRE_MAP[categoryId]) {
      setSelectedGenres(CATEGORY_GENRE_MAP[categoryId]);
    } else {
      setSelectedGenres([]);
    }
  }, [genreFromUrl, categoryId, getGenresFromUrl]);

  const isSimilarMoviesPage = location.pathname.startsWith('/similar-movies/');

  // Genre filter bo'lsa (URL ?genre=) - barcha kinolardan qidirish (allMovies)
  const isGenreCategoryPage = Boolean(categoryId && CATEGORY_GENRE_MAP[categoryId]);
  const useAllMoviesForGenre = (genreFromUrl || isGenreCategoryPage) && selectedGenres.length > 0;

  // /similar-movies/:movieId - o'xshash filmlar (detail sahifadagi bilan bir xil); /recommended - tavsiya; /category/topRated - yuqori reytingli; /category/:id - bo'lim kinolari
  const categoryFiltered = isSimilarMoviesPage && movieId
    ? (() => {
        const currentMovie = allMovies.find((m) => String(m.id) === String(movieId));
        return getSimilarMovies(currentMovie, allMovies);
      })()
    : useAllMoviesForGenre
    ? allMovies
    : location.pathname === '/recommended'
    ? recommendedMovies
    : categoryId === 'topRated'
      ? getTopRatedMovies(allMovies)
      : categoryId
        ? allMovies.filter(movie =>
            movie.typeCategory?.includes(categoryId) || movie.category === categoryId
          )
        : allMovies;

  // VL faqat anonslar sahifasida yashiriladi; aralash kontentda VL ko'rinadi, lekin anonslar VL filteriga kirmaydi
  const hideVlFilter = categoryId === 'anonslar';

  useEffect(() => {
    if (hideVlFilter && selectedRatingType === 'rating') {
      setSelectedRatingType('ratingImdb');
      setSelectedRating(null);
    }
  }, [hideVlFilter, selectedRatingType]);

  let filteredMovies = categoryFiltered;
  if (selectedRating !== null) {
    filteredMovies = filteredMovies.filter(movie =>
      getRatingFilter(movie, selectedRatingType, selectedRating)
    );
  }
  if (selectedCountry !== null) {
    const normalizedSelectedCountry = normalizeFilterValue(selectedCountry);
    filteredMovies = filteredMovies.filter(
      (movie) => normalizeFilterValue(movie.filterCountry) === normalizedSelectedCountry
    );
  }
  if (selectedGenres.length > 0) {
    const normalizedSelectedGenres = selectedGenres.map(normalizeFilterValue);
    filteredMovies = filteredMovies.filter((movie) =>
      (movie.filterGenre || []).some((g) =>
        normalizedSelectedGenres.includes(normalizeFilterValue(g))
      )
    );
  }
  if (selectedAge !== null) {
    filteredMovies = filteredMovies.filter(movie => movie.ageRestriction === selectedAge);
  }

  const recommendedLoading = catalogLoading || genresLoading;

  return (
    <div className="recommended-page">
      <Filters
        isLoading={recommendedLoading}
        movies={categoryFiltered}
        hideVlFilter={hideVlFilter}
        selectedRatingType={selectedRatingType}
        selectedRating={selectedRating}
        onRatingTypeSelect={setSelectedRatingType}
        onRatingSelect={setSelectedRating}
        selectedCountry={selectedCountry}
        onCountrySelect={setSelectedCountry}
        selectedGenres={selectedGenres}
        onGenreSelect={setSelectedGenres}
        selectedAge={selectedAge}
        onAgeSelect={setSelectedAge}
      />
      <Movies
        sectionType="all"
        limit={null}
        filteredMovies={filteredMovies}
        hideHeader
        isLoading={recommendedLoading}
      />
    </div>
  );
};

export default RecommendedPage;
