import { useEffect, useMemo, useState } from 'react';
import { fetchRecentItems } from '../../services/recentItemsApi';
import RecentItemsTabs from './RecentItemsTabs';
import RecentItemsList from './RecentItemsList';
import './RecentItemsSection.css';

export default function RecentItemsSection() {
  const [activeTab, setActiveTab] = useState('movies');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    movies: [],
    actors: [],
    banners: [],
    ads: [],
    genres: [],
  });

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const rows = await fetchRecentItems();
        setData(rows);
      } catch (e) {
        setError(e.message || 'Tarkiblar yuklanmadi.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const activeItems = useMemo(() => data[activeTab] || [], [data, activeTab]);

  return (
    <section className="recent-items">
      <h2 className="recent-items__title">Tarkiblar</h2>
      <RecentItemsTabs activeTab={activeTab} onChange={setActiveTab} />
      {error ? <p className="recent-items__error">{error}</p> : null}
      <RecentItemsList items={activeItems} loading={loading} />
    </section>
  );
}
