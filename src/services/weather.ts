import { OPEN_METEO_FORECAST_URL, SOUTHAVEN } from '../config';
import type { WeatherCardData } from '../types';
import { fetchJson } from './http';
import { describeWmo } from './wmo';

type OpenMeteoForecast = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
  };
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
  };
};

export async function fetchSouthavenWeather(): Promise<WeatherCardData> {
  const params = new URLSearchParams({
    latitude: String(SOUTHAVEN.latitude),
    longitude: String(SOUTHAVEN.longitude),
    current: 'temperature_2m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min',
    temperature_unit: 'fahrenheit',
    timezone: SOUTHAVEN.timezone,
    forecast_days: '1',
  });

  const data = await fetchJson<OpenMeteoForecast>(`${OPEN_METEO_FORECAST_URL}?${params.toString()}`);
  const temperature = data.current?.temperature_2m;
  const weatherCode = data.current?.weather_code;
  const high = data.daily?.temperature_2m_max?.[0];
  const low = data.daily?.temperature_2m_min?.[0];

  if (
    typeof temperature !== 'number' ||
    typeof weatherCode !== 'number' ||
    typeof high !== 'number' ||
    typeof low !== 'number'
  ) {
    throw new Error('Open-Meteo response missing temperature fields');
  }

  return {
    kind: 'weather',
    id: 'weather-southaven',
    location: SOUTHAVEN.name,
    temperatureF: Math.round(temperature),
    condition: describeWmo(weatherCode),
    highF: Math.round(high),
    lowF: Math.round(low),
  };
}
