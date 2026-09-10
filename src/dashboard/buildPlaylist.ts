import type { DashboardCard, UnavailableCardData } from '../types';
import { fetchOnThisDay } from '../services/history';
import { fetchFoxHeadlines } from '../services/news';
import { fetchVerseOfTheDay } from '../services/verse';
import { fetchSouthavenWeather } from '../services/weather';

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

  return playlist.filter(Boolean);
}
