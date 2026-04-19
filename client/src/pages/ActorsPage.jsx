import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getActorById } from '../data/actors';
import { allMovies } from '../data/moviesCatalog';
import { useContentLanguage } from '../context/ContentLanguageContext';
import LoaderSkeleton from '../components/LoaderSkeleton/LoaderSkeleton';
import Movies from '../components/Movies/Movies';
import './ActorsPage.css';

const ActorsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { contentLang } = useContentLanguage();
  const [actorsLoading, setActorsLoading] = useState(true);

  const actor = getActorById(id);

  useEffect(() => {
    setActorsLoading(true);
    const timer = setTimeout(() => setActorsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [id]);

  const actorMovies = actor
    ? allMovies.filter(movie => movie.actors?.includes(actor.id))
    : [];

  if (!actor) {
    return (
      <div className="actors-page actors-page-error">
        <h2>{i18n.language === 'uz' ? 'Aktyor topilmadi' : 'Актер не найден'}</h2>
        <button onClick={() => navigate(-1)}>
          {i18n.language === 'uz' ? 'Orqaga' : 'Назад'}
        </button>
      </div>
    );
  }

  const actorName = actor.name[contentLang] || actor.name.uz || actor.name.ru;
  const actorInfo = actor.info?.[contentLang] || actor.info?.uz || actor.info?.ru || '';

  return (
    <div className="actors-page">
      <div className="actors-page-header">
        {actorsLoading ? (
          <LoaderSkeleton variant="actors-page-back" width={100} height={40} className="actors-page-back-skeleton" />
        ) : (
          <button className="actors-page-back" onClick={() => navigate(-1)}>
            ← {i18n.language === 'uz' ? 'Orqaga' : 'Назад'}
          </button>
        )}
        <div className="actors-page-profile">
          {actorsLoading ? (
            <>
              <LoaderSkeleton variant="actors-page-image" width={120} className="actors-page-image-skeleton" />
              <div className="actors-page-info actors-page-info-skeleton">
                <LoaderSkeleton variant="actors-page-name" width="80%" height={36} className="actors-page-name-skeleton" />
                <LoaderSkeleton variant="actors-page-desc" width="100%" height={60} className="actors-page-desc-skeleton" />
              </div>
            </>
          ) : (
            <>
              <div className="actors-page-image">
                <img src={actor.image} alt={actorName} />
              </div>
              <div className="actors-page-info">
                <h1 className="actors-page-name">{actorName}</h1>
                <p className="actors-page-desc">{actorInfo}</p>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="actors-page-movies">
        {actorsLoading ? (
          <LoaderSkeleton variant="text" width={180} height={28} className="actors-page-movies-title-skeleton" />
        ) : (
          <h2 className="actors-page-movies-title">
            {i18n.language === 'uz' ? 'Filmlar' : 'Фильмы'} ({actorMovies.length})
          </h2>
        )}
        <Movies
          sectionType="all"
          limit={null}
          filteredMovies={actorMovies}
          hideHeader
          isLoading={actorsLoading}
        />
      </div>
    </div>
  );
};

export default ActorsPage;
