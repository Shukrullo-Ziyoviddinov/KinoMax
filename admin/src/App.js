import { useState } from 'react';
import AdminLayout from './components/AdminLayout/AdminLayout';
import DashboardHome from './components/DashboardHome/DashboardHome';
import QuickActions from './components/QuickActions/QuickActions';
import ElementAddModal from './components/ElementAddModal/ElementAddModal';
import BannerForm from './components/BannerForm/BannerForm';

function App() {
  const [activeModal, setActiveModal] = useState('');

  const onActionClick = (actionId) => {
    if (actionId === 'banner') {
      setActiveModal('banner');
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

      <ElementAddModal isOpen={activeModal === 'banner'} title="Banner qo'shish" onClose={closeModal}>
        <BannerForm onCancel={closeModal} onSaved={closeModal} />
      </ElementAddModal>
    </AdminLayout>
  );
}

export default App;
