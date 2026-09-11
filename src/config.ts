/** Dwell time for each dashboard card. Tap advances early. */
export const CARD_INTERVAL_MS = 10_000;

/** Fade in/out between cards. */
export const CARD_FADE_MS = 520;

/**
 * Hatch showpiece replaces a simple branding card on every Nth branding pass.
 * 10 = rare (default). 5 or 20 are the other fridge-friendly choices. 1 = every branding slot.
 */
export const BRANDING_SHOWPIECE_EVERY = 10;

/**
 * Showpiece dwell. Hatch motion itself is ~5 seconds (Frank’s reference);
 * the rest holds the serif mark + greeting. Simple branding still uses CARD_INTERVAL_MS.
 */
export const BRANDING_SHOWPIECE_MS = 10_000;

/** Reload remote feeds while the kiosk stays up. */
export const PLAYLIST_REFRESH_MS = 15 * 60 * 1000;

export const FETCH_TIMEOUT_MS = 12_000;

export const HOUSEHOLD_TIMEZONE = 'America/Chicago';

/** Open-Meteo geocode for Southaven, Mississippi (De Soto County). */
export const SOUTHAVEN = {
  name: 'Southaven, Mississippi',
  latitude: 34.98898,
  longitude: -90.01259,
  timezone: HOUSEHOLD_TIMEZONE,
} as const;

export const USER_AGENT =
  'NestorAssistant/1.3 (https://github.com/shootngo/nestor-assistant; kitchen kiosk)';

/**
 * Fox News RSS. `https://www.foxnews.com/about/rss` is an HTML page (301 to
 * the RSS index story), not a feed. The working feeds live on moxie.
 * Primary: latest headlines. Fallbacks: U.S., then politics.
 */
export const FOX_RSS_CANDIDATES = [
  'https://moxie.foxnews.com/google-publisher/latest.xml',
  'https://moxie.foxnews.com/google-publisher/us.xml',
  'https://moxie.foxnews.com/google-publisher/politics.xml',
] as const;

export const FOX_NEWS_SOURCE_LABEL = 'Fox News';

export const MAX_NEWS_CARDS = 6;
export const MAX_HISTORY_CARDS = 2;

export const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

export const WIKIPEDIA_ONTHISDAY_URL =
  'https://en.wikipedia.org/api/rest_v1/feed/onthisday/selected';

/** Free daily verse (NIV). No API key. */
export const OURMANNA_VOTD_URL = 'https://beta.ourmanna.com/api/v1/get?format=json';

/** Lookup fallback if OurManna is down. Public-domain World English Bible. */
export const BIBLE_API_FALLBACK_URL = 'https://bible-api.com/Psalm+118:24';

export const LOCAL_VERSE_FALLBACK = {
  text: 'This is the day that the LORD has made; we will rejoice and be glad in it.',
  reference: 'Psalm 118:24',
  version: 'KJV',
} as const;

/**
 * Always-listening wake phrase. `nestor` is the kitchen default (single word).
 * If it false-triggers on the fridge, switch to `hey_nestor` — same phase,
 * same model, different keywords file. Rebuild the JS/APK after changing this.
 */
export const WAKE_PHRASE: 'nestor' | 'hey_nestor' = 'nestor';

/** Spoken dismiss. Always registered alongside the wake phrase. */
export const SLEEP_PHRASE = 'goodbye_nestor' as const;

/**
 * Default sherpa-onnx trigger threshold when a keyword line has no `#value`.
 * Higher = less sensitive. Per-keyword `#` in `assets/kws/keywords.*.txt` wins.
 */
export const KWS_KEYWORDS_THRESHOLD = 0.32;

/** Context-graph boost. Higher = easier to match. Prefer retuning `#threshold`. */
export const KWS_KEYWORDS_SCORE = 1.2;

/** How long the egg stays up with no speech before walking off. */
export const LISTENING_SILENCE_MS = 5 * 60 * 1000;

/** Unhurried chicken-legs exit. */
export const EGG_EXIT_MS = 2800;

/**
 * RMS above this (0–1 float PCM) counts as speech and resets the silence timer.
 * Raise if the fridge hum keeps Nestor awake; lower if he sleeps too early.
 */
export const LISTENING_VOICE_RMS = 0.018;

/**
 * Long-press the wordmark (or the listening egg) to preview wake/sleep without
 * speaking. Useful on web and on a tablet before the mic is trusted. Set false
 * once the kitchen is happy with voice-only.
 */
export const ALLOW_WAKE_SIMULATE = true;
