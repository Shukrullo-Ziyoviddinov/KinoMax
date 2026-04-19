import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './ProfileEditModal.css';

const ProfileEditModal = ({ profile, onSave, onClose }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(profile.name || '');
  const [surname, setSurname] = useState(profile.surname || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef(0);

  const isNameInvalid = !name.trim();
  const isSurnameInvalid = !surname.trim();
  const isPhoneInvalid = !phone.trim();
  const isFormValid = !isNameInvalid && !isSurnameInvalid && !isPhoneInvalid;

  useEffect(() => {
    setName(profile.name || '');
    setSurname(profile.surname || '');
    setPhone(profile.phone || '');
  }, [profile]);

  useEffect(() => {
    if (window.innerWidth <= 768) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleTouchStart = (e) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (window.innerWidth > 768) return;
    const y = e.touches[0].clientY;
    const diff = y - startYRef.current;
    if (diff > 0) setDragY(diff);
  };

  const handleTouchEnd = () => {
    if (dragY > 80) onClose();
    setDragY(0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    onSave({ name, surname, phone });
  };

  return (
    <>
      <div className="profile-edit-overlay" onClick={onClose} />
      <div
        className={`profile-edit-modal ${dragY > 0 ? 'profile-edit-modal-dragging' : ''}`}
        style={{ '--drag-y': `${dragY}px` }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="profile-edit-drag-handle" />
        <div className="profile-edit-header">
          <h3 className="profile-edit-title">{t('profile.editProfile')}</h3>
          <button
            className="profile-edit-close profile-edit-close-desktop"
            onClick={onClose}
            aria-label={t('detail.close')}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="profile-edit-form">
          <div className="profile-edit-field">
            <label htmlFor="profile-name">{t('profile.name')}</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('profile.namePlaceholder')}
              className={`profile-edit-input ${isNameInvalid ? 'profile-edit-input-invalid' : ''}`}
            />
          </div>
          <div className="profile-edit-field">
            <label htmlFor="profile-surname">{t('profile.surname')}</label>
            <input
              id="profile-surname"
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              placeholder={t('profile.surnamePlaceholder')}
              className={`profile-edit-input ${isSurnameInvalid ? 'profile-edit-input-invalid' : ''}`}
            />
          </div>
          <div className="profile-edit-field">
            <label htmlFor="profile-phone">{t('profile.phone')}</label>
            <input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('profile.phonePlaceholder')}
              className={`profile-edit-input ${isPhoneInvalid ? 'profile-edit-input-invalid' : ''}`}
            />
          </div>
          <button
            type="submit"
            className="profile-edit-save"
            disabled={!isFormValid}
          >
            {t('profile.save')}
          </button>
        </form>
      </div>
    </>
  );
};

export default ProfileEditModal;
