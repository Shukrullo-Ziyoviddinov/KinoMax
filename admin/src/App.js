import { useState } from 'react';
import AdminLayout from './components/AdminLayout/AdminLayout';
import DashboardHome from './components/DashboardHome/DashboardHome';
import QuickActions from './components/QuickActions/QuickActions';
import RecentItemsSection from './components/RecentItems/RecentItemsSection';
import ElementAddModal from './components/ElementAddModal/ElementAddModal';
import BannerForm from './components/BannerForm/BannerForm';
import GenreForm from './components/GenreForm/GenreForm';

function App() {
  const [activeModal, setActiveModal] = useState('');

  const onActionClick = (actionId) => {
    if (actionId === 'banner' || actionId === 'genre') {
      setActiveModal(actionId);
    }
  };

  const closeModal = () => setActiveModal('');

  return (
    <AdminLayout
      profile={{
        firstName: 'Admin',
        lastName: 'Foydalanuvchi',
      }}
    >
      <DashboardHome />
      <QuickActions onActionClick={onActionClick} />
      <RecentItemsSection />

      <ElementAddModal
        isOpen={Boolean(activeModal)}
        title={activeModal === 'genre' ? "Janr qo'shish" : "Banner qo'shish"}
        onClose={closeModal}
      >
        {activeModal === 'genre' ? (
          <GenreForm onCancel={closeModal} onSaved={closeModal} />
        ) : (
          <BannerForm onCancel={closeModal} onSaved={closeModal} />
        )}
      </ElementAddModal>
    </AdminLayout>
  );
}

export default App;
