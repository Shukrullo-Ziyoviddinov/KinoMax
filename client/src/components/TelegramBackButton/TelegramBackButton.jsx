import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function getTelegramWebApp() {
  const tg = window?.Telegram?.WebApp;
  if (!tg?.BackButton) return null;

  const isTelegramClient =
    /Telegram/i.test(window.navigator?.userAgent || '') ||
    Boolean(tg.initData);

  return isTelegramClient ? tg : null;
}

/** WatchModal ochiq bo‘lsa, Telegram ← shu handler orqali modalni yopadi */
let watchModalCloseHandler = null;

export function setTelegramWatchModalClose(handler) {
  watchModalCloseHandler = typeof handler === 'function' ? handler : null;
}

/**
 * Telegram Mini App yuqori ← BackButton:
 * "/" da yashirin (faqat X), boshqa route'larda ko'rinadi.
 * Watch modal ochiq bo‘lsa — faqat modal yopiladi.
 */
function TelegramBackButton() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg) return undefined;

    const backButton = tg.BackButton;

    const handleBack = () => {
      if (watchModalCloseHandler) {
        watchModalCloseHandler();
        return;
      }
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/', { replace: true });
      }
    };

    if (location.pathname === '/') {
      backButton.hide();
    } else {
      backButton.show();
    }

    if (typeof backButton.onClick === 'function') {
      backButton.onClick(handleBack);
    }

    return () => {
      if (typeof backButton.offClick === 'function') {
        backButton.offClick(handleBack);
      }
      backButton.hide();
    };
  }, [location.pathname, navigate]);

  return null;
}

export default TelegramBackButton;
export { getTelegramWebApp };
