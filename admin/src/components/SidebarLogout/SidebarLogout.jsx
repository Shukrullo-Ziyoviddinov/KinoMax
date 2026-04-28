function LogoutIcon() {
  return (
    <svg className="sidebar__nav-icon" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
      />
    </svg>
  );
}

/**
 * Chiqish (keyin sessiya / API bilan ulanadi).
 */
export default function SidebarLogout({ onCloseMobile }) {
  return (
    <div className="sidebar__logout">
      <button
        type="button"
        className="sidebar__logout-btn"
        onClick={() => {
          onCloseMobile?.();
        }}
      >
        <LogoutIcon />
        <span>Chiqish</span>
      </button>
    </div>
  );
}
