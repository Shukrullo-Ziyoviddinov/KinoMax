import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoading } from '../context/LoadingContext';
import { DEFAULT_LIMIT } from '../components/ShowMoreButton/ShowMoreButton';
import Banner from '../components/Banner/Banner';
import Categories from '../components/Categories';
import Movies from '../components/Movies/Movies';
import { useMoviesCatalog } from '../context/MoviesCatalogContext';
import TopRatedContent from '../components/TopRatedContent/TopRatedContent';
import './Home.css';

const Home = () => {
  const { t } = useTranslation();
  const { setLoading } = useLoading();
  const { sections, isLoading: catalogLoading, hasMore, isLoadingMore } = useMoviesCatalog();

  const {
    koreaDrama = [],
    kinolar = [],
    worldMovies = [],
    animations = [],
    turkishSeries = [],
    russianMovies = [],
    tvSeries = [],
    actionMovies = [],
    horrorMovies = [],
    anime = [],
    adventureMovies = [],
    romanceMovies = [],
    retroMovies = [],
    uzbekMovies = [],
  } = sections || {};

  useEffect(() => {
    setLoading('movies', catalogLoading);
    return () => setLoading('movies', false);
  }, [catalogLoading, setLoading]);

  const sectionConfigs = [
    { sectionType: 'koreaDrama', data: koreaDrama, title: t('movies.koreaDrama'), to: '/category/korea' },
    { sectionType: 'kinolar', data: kinolar, title: t('movies.kinolar'), to: '/category/kinolar' },
    { sectionType: 'worldMovies', data: worldMovies, title: t('movies.worldMovies'), to: '/category/worldMovies' },
    { sectionType: 'animations', data: animations, title: t('movies.animations'), to: '/category/animations' },
    { sectionType: 'turkishSeries', data: turkishSeries, title: t('movies.turkishSeries'), to: '/category/turkishSeries' },
    { sectionType: 'russianMovies', data: russianMovies, title: t('movies.russianMovies'), to: '/category/russianMovies' },
    { sectionType: 'tvSeries', data: tvSeries, title: t('movies.tvSeries'), to: '/category/tvSeries' },
    { sectionType: 'topRated', isTopRated: true },
    { sectionType: 'actionMovies', data: actionMovies, title: t('movies.actionMovies'), to: '/category/actionMovies' },
    { sectionType: 'horrorMovies', data: horrorMovies, title: t('movies.horrorMovies'), to: '/category/horrorMovies' },
    { sectionType: 'anime', data: anime, title: t('movies.anime'), to: '/category/anime' },
    { sectionType: 'adventureMovies', data: adventureMovies, title: t('movies.adventureMovies'), to: '/category/adventureMovies' },
    { sectionType: 'romanceMovies', data: romanceMovies, title: t('movies.romanceMovies'), to: '/category/romanceMovies' },
    { sectionType: 'retroMovies', data: retroMovies, title: t('movies.retroMovies'), to: '/category/retroMovies' },
    { sectionType: 'uzbekMovies', data: uzbekMovies, title: t('movies.uzbekMovies'), to: '/category/uzbekMovies' },
  ];

  let blockFollowingSections = false;
  const renderedSections = sectionConfigs.map((section) => {
      if (section.isTopRated) {
        if (blockFollowingSections) return null;
        return (
          <TopRatedContent
            key="top-rated-content"
            limit={DEFAULT_LIMIT}
            showHorizontalScroll={true}
            moreTo="/category/topRated"
          />
        );
      }

      if (blockFollowingSections) return null;

      const sectionIsEmpty = (section.data?.length || 0) === 0;
      const shouldKeepLoading = sectionIsEmpty && (catalogLoading || isLoadingMore || hasMore);
      const shouldRenderSection = !sectionIsEmpty || shouldKeepLoading;

      if (shouldKeepLoading) {
        blockFollowingSections = true;
      }

      if (!shouldRenderSection) return null;

      return (
        <Movies
          key={section.sectionType}
          sectionType={section.sectionType}
          filteredMovies={section.data}
          limit={DEFAULT_LIMIT}
          showHorizontalScroll={true}
          headerTitle={section.title}
          moreTo={section.to}
          isLoading={shouldKeepLoading}
        />
      );
    });

  return (
    <div className="home">
      <Banner />
      <Categories />
      <Movies sectionType="recommended" limit={DEFAULT_LIMIT} showHorizontalScroll={true} />
      {renderedSections}
    </div>
  );
};

export default Home;
