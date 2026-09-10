import type { HistoryCardData } from '../../types';
import { PhotoCard } from './PhotoCard';

export function HistoryCard({ card }: { card: HistoryCardData }) {
  const year = card.year != null ? String(card.year) : null;
  return (
    <PhotoCard
      testID="nestor-card-history"
      imageUrl={card.imageUrl}
      kicker="This day in history"
      meta={year}
      title={card.text}
    />
  );
}
