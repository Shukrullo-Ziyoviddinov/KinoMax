import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { registerUser, loginUser } from '../../api/authApi';
import { saveAuthSession } from '../../utils/authStorage';
import './SiginModal.css';

const SiginModal = ({ onClose, onSuccess }) => {
  const { t } = useTranslation();
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
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const isRegister = mode === 'register';

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
    setServerError('');
  };

  const handleAvatarSelect = () => fileInputRef.current?.click();

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
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
    setServerError('');

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
      onSuccess?.();
    } catch (error) {
      setServerError(error?.message || t('auth.errorFallback'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    setServerError('');

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
      onSuccess?.();
    } catch (error) {
      setServerError(error?.message || t('auth.errorFallback'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="sigin-modal-overlay" onClick={onClose} />
      <div className="sigin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sigin-modal-header">
          <h3 className="sigin-modal-title">{t('auth.title')}</h3>
          <button className="sigin-modal-close" onClick={onClose} aria-label={t('detail.close')}>
            ×
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

        {serverError ? <p className="sigin-modal-server-error">{serverError}</p> : null}

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

            <input
              type="password"
              placeholder={t('auth.password')}
              value={registerForm.password}
              onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
              className={errors.password ? 'invalid' : ''}
            />
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

            <input
              type="password"
              placeholder={t('auth.password')}
              value={loginForm.password}
              onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
              className={errors.password ? 'invalid' : ''}
            />
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
