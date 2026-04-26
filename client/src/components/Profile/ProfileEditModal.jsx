import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../context/ToastContext';
import './ProfileEditModal.css';

const ProfileEditModal = ({ profile, onSave, onClose }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [name, setName] = useState(profile.name || '');
  const [surname, setSurname] = useState(profile.surname || '');
  const [avatar, setAvatar] = useState(profile.avatar || null);
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef(0);
  const fileInputRef = useRef(null);

  const isNameInvalid = !name.trim();
  const isSurnameInvalid = !surname.trim();
  const isFormValid = !isNameInvalid && !isSurnameInvalid;

  useEffect(() => {
    setName(profile.name || '');
    setSurname(profile.surname || '');
    setAvatar(profile.avatar || null);
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

  const handleAvatarEdit = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatar(ev.target?.result || null);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleAvatarRemove = () => {
    setAvatar(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    if (!avatar) {
      showToast(t('toast.profileAvatarRequired'), 'error');
      return;
    }
    onSave({ name, surname, avatar });
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
          <div className="profile-edit-avatar-section">
            <div className="profile-edit-avatar-preview">
              {avatar ? (
                <img src={avatar} alt="" className="profile-edit-avatar-img" />
              ) : (
                <svg
                  className="profile-edit-avatar-icon"
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="profile-edit-avatar-input"
            />
            <div className="profile-edit-avatar-actions">
              <button type="button" className="profile-edit-avatar-btn profile-edit-avatar-btn-edit" onClick={handleAvatarEdit}>
                {t('profile.avatarEdit')}
              </button>
              <button type="button" className="profile-edit-avatar-btn profile-edit-avatar-btn-delete" onClick={handleAvatarRemove}>
                {t('profile.avatarDelete')}
              </button>
            </div>
          </div>
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
