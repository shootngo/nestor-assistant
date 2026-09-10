import { MAX_HISTORY_CARDS, USER_AGENT, WIKIPEDIA_ONTHISDAY_URL } from '../config';
import { householdDate } from '../time';
import type { HistoryCardData } from '../types';
import { fetchJson } from './http';

type WikiImage = {
  source?: string;
};

type WikiPage = {
  thumbnail?: WikiImage;
  originalimage?: WikiImage;
};

type WikiOnThisDayEvent = {
  text?: string;
  year?: number;
  pages?: WikiPage[];
};

type WikiOnThisDayResponse = {
  selected?: WikiOnThisDayEvent[];
};

function eventImage(event: WikiOnThisDayEvent): string | null {
  const pages = event.pages ?? [];
  for (const page of pages) {
    const source = page.thumbnail?.source ?? page.originalimage?.source;
    if (source && /^https?:\/\//i.test(source)) {
      return source;
    }
  }
  return null;
}

export async function fetchOnThisDay(): Promise<HistoryCardData[]> {
  const { month, day } = householdDate();
  const data = await fetchJson<WikiOnThisDayResponse>(
    `${WIKIPEDIA_ONTHISDAY_URL}/${month}/${day}`,
    {
      Accept: 'application/json',
      'Api-User-Agent': USER_AGENT,
    },
  );

  const selected = data.selected ?? [];
  const cards: HistoryCardData[] = [];

  for (const [index, event] of selected.entries()) {
    const text = event.text?.trim();
    if (!text) {
      continue;
    }

    cards.push({
      kind: 'history',
      id: `history-${event.year ?? index}-${index}`,
      year: typeof event.year === 'number' ? event.year : null,
      text,
      imageUrl: eventImage(event),
    });

    if (cards.length >= MAX_HISTORY_CARDS) {
      break;
    }
  }

  if (cards.length === 0) {
    throw new Error('Wikipedia On This Day returned no selected events');
  }

  return cards;
}
