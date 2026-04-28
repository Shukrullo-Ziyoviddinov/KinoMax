import StatCard from './StatCard';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import './DashboardHome.css';

const STATS = [
  { variant: 'movies', label: 'Kinolar', value: '1 248' },
  { variant: 'actors', label: 'Aktyorlar', value: '342' },
  { variant: 'banners', label: 'Bannerlar', value: '8' },
  { variant: 'ads', label: 'Reklamalar', value: '12' },
  { variant: 'genres', label: 'Janrlar', value: '24' },
];

export default function DashboardHome() {
  return (
    <div className="dashboard-home">
      <ScrollTouch className="dashboard-home__stats" role="list">
        {STATS.map((item) => (
          <div key={item.variant} className="dashboard-home__stat-wrap" role="listitem">
            <StatCard variant={item.variant} label={item.label} value={item.value} />
          </div>
        ))}
      </ScrollTouch>
    </div>
  );
}
