import { useState } from 'react';
import AdminLayout from './components/AdminLayout/AdminLayout';
import DashboardHome from './components/DashboardHome/DashboardHome';
import QuickActions from './components/QuickActions/QuickActions';
import RecentItemsSection from './components/RecentItems/RecentItemsSection';
import ElementAddModal from './components/ElementAddModal/ElementAddModal';
import BannerForm from './components/BannerForm/BannerForm';
import GenreForm from './components/GenreForm/GenreForm';
import AdsForm from './components/AdsForm/AdsForm';
import ActorForm from './components/ActorForm/ActorForm';
import MovieForm from './components/MovieForm/MovieForm';
import SettingsLinksForm from './components/SettingsLinksForm/SettingsLinksForm';
import TranslationSettingsForm from './components/TranslationSettingsForm/TranslationSettingsForm';

function App() {
  const [activeModal, setActiveModal] = useState('');

  const onActionClick = (actionId) => {
    if (actionId === 'banner' || actionId === 'genre' || actionId === 'ad' || actionId === 'actor' || actionId === 'movie') {
      setActiveModal(actionId);
    }
  };

  const onSettingsClick = (settingId) => {
    if (settingId === 'social') setActiveModal('settings-social');
    if (settingId === 'app-links') setActiveModal('settings-app-links');
    if (settingId === 'language') setActiveModal('settings-language');
    if (settingId === 'contact') setActiveModal('settings-contact');
  };

  const modalTitleMap = {
    banner: "Banner qo'shish",
    genre: "Janr qo'shish",
    ad: "Reklama qo'shish",
    actor: "Aktyor qo'shish",
    movie: "Kino qo'shish",
    'settings-social': 'Ijtimoiy tarmoqlar',
    'settings-app-links': 'Ilova havolalari',
    'settings-language': 'Til sozlamalari',
    'settings-contact': 'Aloqa',
  };

  const closeModal = () => setActiveModal('');

  return (
    <AdminLayout
      profile={{
        firstName: 'Admin',
        lastName: 'Foydalanuvchi',
      }}
      onSettingsClick={onSettingsClick}
    >
      <DashboardHome />
      <QuickActions onActionClick={onActionClick} />
      <RecentItemsSection />

      <ElementAddModal
        isOpen={Boolean(activeModal)}
        title={modalTitleMap[activeModal] || "Element qo'shish"}
        onClose={closeModal}
      >
        {activeModal === 'genre' ? (
          <GenreForm onCancel={closeModal} onSaved={closeModal} />
        ) : activeModal === 'movie' ? (
          <MovieForm onCancel={closeModal} onSaved={closeModal} />
        ) : activeModal === 'settings-social' ? (
          <SettingsLinksForm section="social" onCancel={closeModal} onSaved={closeModal} />
        ) : activeModal === 'settings-app-links' ? (
          <SettingsLinksForm section="app-links" onCancel={closeModal} onSaved={closeModal} />
        ) : activeModal === 'settings-language' ? (
          <TranslationSettingsForm onCancel={closeModal} onSaved={closeModal} />
        ) : activeModal === 'settings-contact' ? (
          <SettingsLinksForm section="contact" onCancel={closeModal} onSaved={closeModal} />
        ) : activeModal === 'actor' ? (
          <ActorForm onCancel={closeModal} onSaved={closeModal} />
        ) : activeModal === 'ad' ? (
          <AdsForm onCancel={closeModal} onSaved={closeModal} />
        ) : (
          <BannerForm onCancel={closeModal} onSaved={closeModal} />
        )}
      </ElementAddModal>
    </AdminLayout>
  );
}

export default App;
