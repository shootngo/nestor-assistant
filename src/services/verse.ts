import {
  BIBLE_API_FALLBACK_URL,
  LOCAL_VERSE_FALLBACK,
  OURMANNA_VOTD_URL,
} from '../config';
import type { VerseCardData } from '../types';
import { fetchJson } from './http';

type OurMannaResponse = {
  verse?: {
    details?: {
      text?: string;
      reference?: string;
      version?: string;
    };
  };
};

type BibleApiResponse = {
  text?: string;
  reference?: string;
  translation_id?: string;
  translation_name?: string;
};

function verseCard(
  text: string,
  reference: string,
  version: string,
  fromFallback: boolean,
  id: string,
): VerseCardData {
  return {
    kind: 'verse',
    id,
    text: text.replace(/\s+/g, ' ').trim(),
    reference: reference.trim(),
    version: version.trim(),
    fromFallback,
  };
}

export async function fetchVerseOfTheDay(): Promise<VerseCardData> {
  try {
    const data = await fetchJson<OurMannaResponse>(OURMANNA_VOTD_URL);
    const details = data.verse?.details;
    if (details?.text && details.reference) {
      return verseCard(
        details.text,
        details.reference,
        details.version ?? 'NIV',
        false,
        'verse-ourmanna',
      );
    }
  } catch {
    // Fall through to bible-api.com, then the local verse.
  }

  try {
    const data = await fetchJson<BibleApiResponse>(BIBLE_API_FALLBACK_URL);
    if (data.text && data.reference) {
      return verseCard(
        data.text,
        data.reference,
        data.translation_id?.toUpperCase() ?? data.translation_name ?? 'WEB',
        true,
        'verse-bible-api',
      );
    }
  } catch {
    // Local copy is the last calm fallback so the kiosk still has a verse card.
  }

  return verseCard(
    LOCAL_VERSE_FALLBACK.text,
    LOCAL_VERSE_FALLBACK.reference,
    LOCAL_VERSE_FALLBACK.version,
    true,
    'verse-local',
  );
}
