import { useEffect, useState } from 'react';
import { fetchRecentItems } from '../../services/recentItemsApi';
import RecentItemsList from '../RecentItems/RecentItemsList';
import './ContentSectionPage.css';

const TITLE_MAP = {
  movies: 'Kinolar',
  actors: 'Aktyorlar',
  banners: 'Bannerlar',
  ads: 'Reklamalar',
  genres: 'Janrlar',
};

export default function ContentSectionPage({ section = 'movies' }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const rows = await fetchRecentItems();
        setItems(rows?.[section] || []);
      } catch (e) {
        setError(e.message || 'Ma\'lumotlar yuklanmadi.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [section]);

  return (
    <section className="content-section-page">
      <h2 className="content-section-page__title">{TITLE_MAP[section] || 'Tarkiblar'}</h2>
      {error ? <p className="content-section-page__error">{error}</p> : null}
      <RecentItemsList items={items} loading={loading} />
    </section>
  );
}
