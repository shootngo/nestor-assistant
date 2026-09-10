import type { DashboardCard } from '../../types';
import { HistoryCard } from './HistoryCard';
import { NewsCard } from './NewsCard';
import { UnavailableCard } from './UnavailableCard';
import { VerseCard } from './VerseCard';
import { WeatherCard } from './WeatherCard';

export function DashboardCardView({ card }: { card: DashboardCard }) {
  switch (card.kind) {
    case 'weather':
      return <WeatherCard card={card} />;
    case 'news':
      return <NewsCard card={card} />;
    case 'history':
      return <HistoryCard card={card} />;
    case 'verse':
      return <VerseCard card={card} />;
    case 'unavailable':
      return <UnavailableCard card={card} />;
  }
}
