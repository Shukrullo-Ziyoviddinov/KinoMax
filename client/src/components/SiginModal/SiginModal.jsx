import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { registerUser, loginUser } from '../../api/authApi';
import { saveAuthSession } from '../../utils/authStorage';
import { useToast } from '../../context/ToastContext';
import './SiginModal.css';

const SiginModal = ({ onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [mode, setMode] = useState('register');
  const [registerForm, setRegisterForm] = useState({
    avatar: null,
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
  });
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const fileInputRef = useRef(null);

  const isRegister = mode === 'register';
  const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

  const registerValidation = useMemo(
    () => ({
      avatar: !registerForm.avatar ? t('auth.validation.avatar') : '',
      firstName: !registerForm.firstName.trim() ? t('auth.validation.firstName') : '',
      lastName: !registerForm.lastName.trim() ? t('auth.validation.lastName') : '',
      phone: !registerForm.phone.trim() ? t('auth.validation.phone') : '',
      password: !registerForm.password.trim() ? t('auth.validation.password') : '',
    }),
    [registerForm, t]
  );

  const loginValidation = useMemo(
    () => ({
      phone: !loginForm.phone.trim() ? t('auth.validation.phone') : '',
      password: !loginForm.password.trim() ? t('auth.validation.password') : '',
    }),
    [loginForm, t]
  );

  const setModeAndReset = (nextMode) => {
    setMode(nextMode);
    setErrors({});
  };

  const handleAvatarSelect = () => fileInputRef.current?.click();

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > MAX_AVATAR_SIZE_BYTES) {
        const message = t('auth.validation.avatarSize');
        setErrors((prev) => ({ ...prev, avatar: message }));
        showToast(message, 'error');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setRegisterForm((prev) => ({ ...prev, avatar: ev.target?.result || null }));
      };
      reader.readAsDataURL(file);
      setErrors((prev) => ({ ...prev, avatar: '' }));
    }
    e.target.value = '';
  };

  const handleSubmitRegister = async (e) => {
    e.preventDefault();
    const nextErrors = registerValidation;
    const hasError = Object.values(nextErrors).some(Boolean);
    setErrors(nextErrors);
    if (hasError) return;

    setLoading(true);
    try {
      const result = await registerUser({
        firstName: registerForm.firstName.trim(),
        lastName: registerForm.lastName.trim(),
        phone: registerForm.phone.trim(),
        password: registerForm.password.trim(),
        avatar: registerForm.avatar,
      });
      saveAuthSession(result);
      showToast(t('auth.registerSuccess'), 'success');
      onSuccess?.();
    } catch (error) {
      const message =
        error?.status === 413
          ? t('toast.requestTooLarge')
          : (error?.message || t('auth.errorFallback'));
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    const nextErrors = loginValidation;
    const hasError = Object.values(nextErrors).some(Boolean);
    setErrors(nextErrors);
    if (hasError) return;

    setLoading(true);
    try {
      const result = await loginUser({
        phone: loginForm.phone.trim(),
        password: loginForm.password.trim(),
      });
      saveAuthSession(result);
      showToast(t('auth.loginSuccess'), 'success');
      onSuccess?.();
    } catch (error) {
      const message =
        error?.status === 413
          ? t('toast.requestTooLarge')
          : (error?.message || t('auth.errorFallback'));
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="sigin-modal-overlay" onClick={onClose} />
      <div className="sigin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sigin-modal-header">
          <div className="sigin-modal-header-logo">
            <img src="/img/KinoMaxLogo_preview_rev_1.png" alt="KinoMax" className="sigin-modal-header-logo-img" />
          </div>
          <button className="sigin-modal-close" onClick={onClose} aria-label={t('detail.close')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="sigin-modal-switch">
          <button
            type="button"
            className={`sigin-modal-switch-btn ${isRegister ? 'active' : ''}`}
            onClick={() => setModeAndReset('register')}
          >
            {t('auth.register')}
          </button>
          <button
            type="button"
            className={`sigin-modal-switch-btn ${!isRegister ? 'active' : ''}`}
            onClick={() => setModeAndReset('login')}
          >
            {t('auth.login')}
          </button>
        </div>

        {isRegister ? (
          <form className="sigin-modal-form" onSubmit={handleSubmitRegister}>
            <input ref={fileInputRef} type="file" accept="image/*" className="sigin-modal-hidden-input" onChange={handleAvatarChange} />

            <button type="button" className="sigin-modal-avatar-picker" onClick={handleAvatarSelect}>
              {registerForm.avatar ? (
                <img src={registerForm.avatar} alt="" className="sigin-modal-avatar-img" />
              ) : (
                <span>{t('auth.uploadImage')}</span>
              )}
            </button>
            {errors.avatar ? <span className="sigin-modal-error">{errors.avatar}</span> : null}

            <input
              type="text"
              placeholder={t('profile.name')}
              value={registerForm.firstName}
              onChange={(e) => setRegisterForm((prev) => ({ ...prev, firstName: e.target.value }))}
              className={errors.firstName ? 'invalid' : ''}
            />
            {errors.firstName ? <span className="sigin-modal-error">{errors.firstName}</span> : null}

            <input
              type="text"
              placeholder={t('profile.surname')}
              value={registerForm.lastName}
              onChange={(e) => setRegisterForm((prev) => ({ ...prev, lastName: e.target.value }))}
              className={errors.lastName ? 'invalid' : ''}
            />
            {errors.lastName ? <span className="sigin-modal-error">{errors.lastName}</span> : null}

            <input
              type="tel"
              placeholder={t('profile.phone')}
              value={registerForm.phone}
              onChange={(e) => setRegisterForm((prev) => ({ ...prev, phone: e.target.value }))}
              className={errors.phone ? 'invalid' : ''}
            />
            {errors.phone ? <span className="sigin-modal-error">{errors.phone}</span> : null}

            <div className="sigin-modal-password-wrap">
              <input
                type={showRegisterPassword ? 'text' : 'password'}
                placeholder={t('auth.password')}
                value={registerForm.password}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                className={errors.password ? 'invalid' : ''}
              />
              <button
                type="button"
                className="sigin-modal-password-toggle"
                onClick={() => setShowRegisterPassword((prev) => !prev)}
                aria-label={showRegisterPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showRegisterPassword ? '🙈' : '👁'}
              </button>
            </div>
            {errors.password ? <span className="sigin-modal-error">{errors.password}</span> : null}

            <button type="submit" className="sigin-modal-submit" disabled={loading}>
              {loading ? t('auth.loading') : t('auth.continue')}
            </button>
          </form>
        ) : (
          <form className="sigin-modal-form" onSubmit={handleSubmitLogin}>
            <input
              type="tel"
              placeholder={t('profile.phone')}
              value={loginForm.phone}
              onChange={(e) => setLoginForm((prev) => ({ ...prev, phone: e.target.value }))}
              className={errors.phone ? 'invalid' : ''}
            />
            {errors.phone ? <span className="sigin-modal-error">{errors.phone}</span> : null}

            <div className="sigin-modal-password-wrap">
              <input
                type={showLoginPassword ? 'text' : 'password'}
                placeholder={t('auth.password')}
                value={loginForm.password}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                className={errors.password ? 'invalid' : ''}
              />
              <button
                type="button"
                className="sigin-modal-password-toggle"
                onClick={() => setShowLoginPassword((prev) => !prev)}
                aria-label={showLoginPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showLoginPassword ? '🙈' : '👁'}
              </button>
            </div>
            {errors.password ? <span className="sigin-modal-error">{errors.password}</span> : null}

            <button type="submit" className="sigin-modal-submit" disabled={loading}>
              {loading ? t('auth.loading') : t('auth.login')}
            </button>
          </form>
        )}
      </div>
    </>
  );
};

export default SiginModal;
