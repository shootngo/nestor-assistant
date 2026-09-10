/** Dwell time for each dashboard card. Tap advances early. */
export const CARD_INTERVAL_MS = 10_000;

/** Fade in/out between cards. */
export const CARD_FADE_MS = 520;

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
  'NestorAssistant/1.1 (https://github.com/shootngo/nestor-assistant; kitchen kiosk)';

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
