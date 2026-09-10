export type WeatherCardData = {
  kind: 'weather';
  id: string;
  location: string;
  temperatureF: number;
  condition: string;
  highF: number;
  lowF: number;
};

export type NewsCardData = {
  kind: 'news';
  id: string;
  title: string;
  imageUrl: string | null;
  source: 'Fox News';
};

export type HistoryCardData = {
  kind: 'history';
  id: string;
  year: number | null;
  text: string;
  imageUrl: string | null;
};

export type VerseCardData = {
  kind: 'verse';
  id: string;
  text: string;
  reference: string;
  version: string;
  fromFallback: boolean;
};

export type UnavailableCardData = {
  kind: 'unavailable';
  id: string;
  topic: string;
};

export type BrandingMode = 'simple' | 'showpiece';

export type BrandingCardData = {
  kind: 'branding';
  id: string;
  line: string;
  mode: BrandingMode;
};

export type DashboardCard =
  | WeatherCardData
  | NewsCardData
  | HistoryCardData
  | VerseCardData
  | UnavailableCardData
  | BrandingCardData;
