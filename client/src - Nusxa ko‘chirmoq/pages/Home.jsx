import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoading } from '../context/LoadingContext';
import { DEFAULT_LIMIT } from '../components/ShowMoreButton/ShowMoreButton';
import Banner from '../components/Banner/Banner';
import Categories from '../components/Categories';
import Movies from '../components/Movies/Movies';
import {
  koreaDrama,
  kinolar,
  worldMovies,
  animations,
  turkishSeries,
  russianMovies,
  tvSeries,
  actionMovies,
  horrorMovies,
  anime,
  adventureMovies,
  romanceMovies,
  retroMovies,
  uzbekMovies,
} from '../data/moviesCatalog';
import TopRatedContent from '../components/TopRatedContent/TopRatedContent';
import './Home.css';

const Home = () => {
  const { t } = useTranslation();
  const { setLoading } = useLoading();
  useEffect(() => {
    setLoading('movies', true);
    const timer = setTimeout(() => setLoading('movies', false), 500);
    return () => clearTimeout(timer);
  }, [setLoading]);
  return (
    <div className="home">
      <Banner />
      <Categories />
      <Movies sectionType="recommended" limit={DEFAULT_LIMIT} showHorizontalScroll={true} />
      <Movies
        sectionType="koreaDrama"
        filteredMovies={koreaDrama}
        limit={DEFAULT_LIMIT}
        showHorizontalScroll={true}
        headerTitle={t('movies.koreaDrama')}
        moreTo="/category/korea"
      />
      <Movies
        sectionType="kinolar"
        filteredMovies={kinolar}
        limit={DEFAULT_LIMIT}
        showHorizontalScroll={true}
        headerTitle={t('movies.kinolar')}
        moreTo="/category/kinolar"
      />
      <Movies
        sectionType="worldMovies"
        filteredMovies={worldMovies}
        limit={DEFAULT_LIMIT}
        showHorizontalScroll={true}
        headerTitle={t('movies.worldMovies')}
        moreTo="/category/worldMovies"
      />
      <Movies
        sectionType="animations"
        filteredMovies={animations}
        limit={DEFAULT_LIMIT}
        showHorizontalScroll={true}
        headerTitle={t('movies.animations')}
        moreTo="/category/animations"
      />
      <Movies
        sectionType="turkishSeries"
        filteredMovies={turkishSeries}
        limit={DEFAULT_LIMIT}
        showHorizontalScroll={true}
        headerTitle={t('movies.turkishSeries')}
        moreTo="/category/turkishSeries"
      />
      <Movies
        sectionType="russianMovies"
        filteredMovies={russianMovies}
        limit={DEFAULT_LIMIT}
        showHorizontalScroll={true}
        headerTitle={t('movies.russianMovies')}
        moreTo="/category/russianMovies"
      />
      <Movies
        sectionType="tvSeries"
        filteredMovies={tvSeries}
        limit={DEFAULT_LIMIT}
        showHorizontalScroll={true}
        headerTitle={t('movies.tvSeries')}
        moreTo="/category/tvSeries"
      />
      <TopRatedContent limit={DEFAULT_LIMIT} showHorizontalScroll={true} moreTo="/category/topRated" />
      <Movies
        sectionType="actionMovies"
        filteredMovies={actionMovies}
        limit={DEFAULT_LIMIT}
        showHorizontalScroll={true}
        headerTitle={t('movies.actionMovies')}
        moreTo="/category/actionMovies"
      />
      <Movies
        sectionType="horrorMovies"
        filteredMovies={horrorMovies}
        limit={DEFAULT_LIMIT}
        showHorizontalScroll={true}
        headerTitle={t('movies.horrorMovies')}
        moreTo="/category/horrorMovies"
      />
      <Movies
        sectionType="anime"
        filteredMovies={anime}
        limit={DEFAULT_LIMIT}
        showHorizontalScroll={true}
        headerTitle={t('movies.anime')}
        moreTo="/category/anime"
      />
      <Movies
        sectionType="adventureMovies"
        filteredMovies={adventureMovies}
        limit={DEFAULT_LIMIT}
        showHorizontalScroll={true}
        headerTitle={t('movies.adventureMovies')}
        moreTo="/category/adventureMovies"
      />
      <Movies
        sectionType="romanceMovies"
        filteredMovies={romanceMovies}
        limit={DEFAULT_LIMIT}
        showHorizontalScroll={true}
        headerTitle={t('movies.romanceMovies')}
        moreTo="/category/romanceMovies"
      />
      <Movies
        sectionType="retroMovies"
        filteredMovies={retroMovies}
        limit={DEFAULT_LIMIT}
        showHorizontalScroll={true}
        headerTitle={t('movies.retroMovies')}
        moreTo="/category/retroMovies"
      />
      <Movies
        sectionType="uzbekMovies"
        filteredMovies={uzbekMovies}
        limit={DEFAULT_LIMIT}
        showHorizontalScroll={true}
        headerTitle={t('movies.uzbekMovies')}
        moreTo="/category/uzbekMovies"
      />
    </div>
  );
};

export default Home;
