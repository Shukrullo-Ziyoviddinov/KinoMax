const PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><rect width="100%" height="100%" fill="%23edf0f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23656d82" font-size="10">No img</text></svg>';

export default function RecentItemsList({ items = [], loading = false }) {
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
