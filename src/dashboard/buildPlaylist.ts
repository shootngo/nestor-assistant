import { BRANDING_LINES } from '../branding/copy';
import type { BrandingCardData, DashboardCard, UnavailableCardData } from '../types';
import { fetchOnThisDay } from '../services/history';
import { fetchFoxHeadlines } from '../services/news';
import { fetchVerseOfTheDay } from '../services/verse';
import { fetchSouthavenWeather } from '../services/weather';

let brandingSerial = 0;
let lineCursor = 0;

export function nextBrandingCard(): BrandingCardData {
  const line = BRANDING_LINES[lineCursor % BRANDING_LINES.length];
  lineCursor += 1;
  brandingSerial += 1;
  return {
    kind: 'branding',
    id: `branding-${brandingSerial}`,
    line,
    mode: 'simple',
  };
}

/**
 * Weather, then a branding still, then news/history with a second branding
 * mid-loop, then verse. Showpiece vs still is decided when the slot is shown.
 */
export function insertBrandingCards(cards: DashboardCard[]): DashboardCard[] {
  if (cards.length === 0) {
    return [nextBrandingCard()];
  }

  const out: DashboardCard[] = [cards[0], nextBrandingCard()];
  const rest = cards.slice(1);
  const verseAt = rest.findIndex((card) => card.kind === 'verse');
  const middle = verseAt === -1 ? rest : rest.slice(0, verseAt);
  const tail = verseAt === -1 ? [] : rest.slice(verseAt);

  if (middle.length >= 3) {
    const split = Math.ceil(middle.length / 2);
    out.push(...middle.slice(0, split), nextBrandingCard(), ...middle.slice(split), ...tail);
    return out;
  }

  out.push(...middle);
  if (tail.length > 0) {
    out.push(nextBrandingCard(), ...tail);
  }
  return out;
}

function unavailable(topic: string): UnavailableCardData {
  return {
    kind: 'unavailable',
    id: `unavailable-${topic}`,
    topic,
  };
}

/**
 * Build the idle loop: weather, interleaved news/history, then verse.
 * Individual feed failures become a calm unavailable card — never an empty crash.
 */
export async function loadPlaylist(): Promise<DashboardCard[]> {
  const [weather, news, history, verse] = await Promise.all([
    fetchSouthavenWeather().then(
      (card) => card,
      (error) => {
        if (__DEV__) {
          console.warn('Nestor weather feed failed', error);
        }
        return unavailable('weather');
      },
    ),
    fetchFoxHeadlines().then(
      (result) => result.items,
      (error) => {
        if (__DEV__) {
          console.warn('Nestor news feed failed', error);
        }
        return [unavailable('news')];
      },
    ),
    fetchOnThisDay().then(
      (cards) => cards,
      (error) => {
        if (__DEV__) {
          console.warn('Nestor history feed failed', error);
        }
        return [unavailable('history')];
      },
    ),
    fetchVerseOfTheDay(),
  ]);

  const headlines = Array.isArray(news) ? news : [news];
  const historyCards = Array.isArray(history) ? history : [history];

  const playlist: DashboardCard[] = [weather];

  const newsQueue = [...headlines];
  const historyQueue = [...historyCards];

  while (newsQueue.length > 0 || historyQueue.length > 0) {
    if (newsQueue.length > 0) {
      playlist.push(newsQueue.shift()!);
    }
    if (historyQueue.length > 0) {
      playlist.push(historyQueue.shift()!);
    }
    if (newsQueue.length > 0) {
      playlist.push(newsQueue.shift()!);
    }
  }

  playlist.push(verse);

  return insertBrandingCards(playlist.filter(Boolean));
}
