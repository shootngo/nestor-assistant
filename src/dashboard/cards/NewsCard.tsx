import type { NewsCardData } from '../../types';
import { PhotoCard } from './PhotoCard';

export function NewsCard({ card }: { card: NewsCardData }) {
  return <PhotoCard imageUrl={card.imageUrl} kicker={card.source} title={card.title} />;
}
