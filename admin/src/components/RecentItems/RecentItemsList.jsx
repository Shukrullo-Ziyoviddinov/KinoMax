const PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><rect width="100%" height="100%" fill="%23edf0f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23656d82" font-size="10">No img</text></svg>';

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M3 17.25V21h3.75l11-11.03-3.75-3.75L3 17.25zm17.71-10.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.96 1.96 3.75 3.75 2.13-1.79z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V7H6v12zm3.46-7.12 1.41-1.41L12 11.59l1.13-1.12 1.41 1.41L13.41 13l1.13 1.12-1.41 1.41L12 14.41l-1.13 1.12-1.41-1.41L10.59 13l-1.13-1.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );
}

export default function RecentItemsList({ items = [], loading = false, onEdit, onDelete }) {
  if (loading) {
    return <div className="recent-items__empty">Yuklanmoqda...</div>;
  }

  if (!items.length) {
    return <div className="recent-items__empty">Maʼlumot topilmadi.</div>;
  }

  return (
    <div className="recent-items__table-wrap">
      <table className="recent-items__table">
        <thead>
          <tr>
            <th>Soni</th>
            <th>Poster</th>
            <th>Nomi (UZ)</th>
            <th>Nomi (RU)</th>
            <th>Amallar</th>
          </tr>
        </thead>
        <tbody>
          {/** Eng yangisi tepada: 100 ta bo'lsa 100, 99, 98... */ }
          {items.map((item, index) => (
            <tr key={`${item.id}-${index}`}>
              <td>{items.length - index}</td>
              <td>
                <img
                  className="recent-items__poster"
                  src={item.image || PLACEHOLDER}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = PLACEHOLDER;
                  }}
                />
              </td>
              <td>{item.title || '-'}</td>
              <td>{item.subtitle || '-'}</td>
              <td>
                <div className="recent-items__actions">
                  <button
                    type="button"
                    className="recent-items__icon-btn"
                    aria-label="Tahrirlash"
                    onClick={() => onEdit?.(item)}
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    className="recent-items__icon-btn recent-items__icon-btn--danger"
                    aria-label="O'chirish"
                    onClick={() => onDelete?.(item)}
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
