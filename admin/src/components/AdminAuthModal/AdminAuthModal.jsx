import { useState } from 'react';
import './AdminAuthModal.css';

const ADMIN_PASSWORD = 'ShZ03_ZH04';

export default function AdminAuthModal({ onSuccess }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit = () => {
    if (!firstName.trim() || !lastName.trim() || !password) {
      setError("Ism, familiya va parolni to'ldiring.");
      return;
    }
    if (password !== ADMIN_PASSWORD) {
      setError("Parol noto'g'ri.");
      return;
    }
    setError('');
    onSuccess?.({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
  };

  return (
    <div className="admin-auth-modal" role="dialog" aria-modal="true" aria-label="Admin login">
      <div className="admin-auth-modal__panel">
        <h1 className="admin-auth-modal__title">Admin panelga kirish</h1>
        <label className="admin-auth-modal__label" htmlFor="admin-first-name">
          Ism
        </label>
        <input
          id="admin-first-name"
          className="admin-auth-modal__input"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <label className="admin-auth-modal__label" htmlFor="admin-last-name">
          Familiya
        </label>
        <input
          id="admin-last-name"
          className="admin-auth-modal__input"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <label className="admin-auth-modal__label" htmlFor="admin-password">
          Parol
        </label>
        <input
          id="admin-password"
          type="password"
          className="admin-auth-modal__input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit();
          }}
        />
        {error ? <p className="admin-auth-modal__error">{error}</p> : null}
        <button type="button" className="admin-auth-modal__submit" onClick={onSubmit}>
          Kirish
        </button>
      </div>
    </div>
  );
}
