import { KWS_KEYWORDS_SCORE, KWS_KEYWORDS_THRESHOLD, SLEEP_PHRASE, WAKE_PHRASE } from '../config';
import type { WakeKeywordId } from './types';

/**
 * BPE pieces from assets/kws/bpe.model (GigaSpeech English KWS).
 * UPPERCASE source text, then sentencepiece encode. See assets/kws/README.md.
 */
export const KEYWORD_PIECES: Record<WakeKeywordId, string> = {
  nestor: '▁NE S T OR',
  hey_nestor: '▁HE Y ▁NE S T OR',
  goodbye_nestor: '▁GOOD B Y E ▁NE S T OR',
};

/** Per-keyword trigger thresholds. Higher = less jumpy. Short wake needs a higher bar. */
export const KEYWORD_THRESHOLD: Record<WakeKeywordId, number> = {
  nestor: 0.42,
  hey_nestor: 0.28,
  goodbye_nestor: 0.22,
};

export const KEYWORD_SCORE: Record<WakeKeywordId, number> = {
  nestor: 1.0,
  hey_nestor: 1.2,
  goodbye_nestor: 1.5,
};

export function keywordsFileName(phrase: typeof WAKE_PHRASE = WAKE_PHRASE): string {
  return phrase === 'hey_nestor' ? 'keywords.hey_nestor.txt' : 'keywords.nestor.txt';
}

export function formatKeywordLine(id: WakeKeywordId): string {
  const score = KEYWORD_SCORE[id];
  const threshold = KEYWORD_THRESHOLD[id];
  return `${KEYWORD_PIECES[id]} :${score} #${threshold} @${id}`;
}

export function keywordsFileContents(phrase: typeof WAKE_PHRASE = WAKE_PHRASE): string {
  return [formatKeywordLine(phrase), formatKeywordLine(SLEEP_PHRASE)].join('\n') + '\n';
}

export function normalizeKeyword(raw: string): WakeKeywordId | null {
  const value = raw.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (value === 'nestor' || value === '@nestor') {
    return 'nestor';
  }
  if (value === 'hey_nestor' || value === 'hey nestor') {
    return 'hey_nestor';
  }
  if (value === 'goodbye_nestor' || value === 'goodbye nestor' || value === 'good_bye_nestor') {
    return 'goodbye_nestor';
  }
  return null;
}

export { KWS_KEYWORDS_SCORE, KWS_KEYWORDS_THRESHOLD };
