import { useEffect, useMemo, useState } from 'react';
import { fetchRecentItems } from '../../services/recentItemsApi';
import { deleteRecentItem } from '../../services/recentItemCrudApi';
import RecentItemsTabs from './RecentItemsTabs';
import RecentItemsList from './RecentItemsList';
import RecentItemEditForm from './RecentItemEditForm';
import ElementAddModal from '../ElementAddModal/ElementAddModal';
import './RecentItemsSection.css';

export default function RecentItemsSection() {
  const [activeTab, setActiveTab] = useState('movies');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState({
    movies: [],
    actors: [],
    banners: [],
    ads: [],
    genres: [],
  });

  const loadData = async () => {
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

  useEffect(() => {
    loadData();
  }, []);

  const activeItems = useMemo(() => data[activeTab] || [], [data, activeTab]);

  const onDelete = async (item) => {
    const ok = window.confirm("Rostdan ham o'chirmoqchimisiz?");
    if (!ok) return;
    setBusy(true);
    setError('');
    try {
      await deleteRecentItem(activeTab, item);
      await loadData();
    } catch (e) {
      setError(e.message || "O'chirishda xatolik.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="recent-items">
      <h2 className="recent-items__title">Tarkiblar</h2>
      <RecentItemsTabs activeTab={activeTab} onChange={setActiveTab} />
      {error ? <p className="recent-items__error">{error}</p> : null}
      <RecentItemsList
        items={activeItems}
        loading={loading || busy}
        onEdit={(item) => setEditItem(item)}
        onDelete={onDelete}
      />

      <ElementAddModal
        isOpen={Boolean(editItem)}
        title="Elementni tahrirlash"
        onClose={() => setEditItem(null)}
      >
        {editItem ? (
          <RecentItemEditForm
            section={activeTab}
            item={editItem}
            onCancel={() => setEditItem(null)}
            onSaved={async () => {
              setEditItem(null);
              await loadData();
            }}
          />
        ) : null}
      </ElementAddModal>
    </section>
  );
}
