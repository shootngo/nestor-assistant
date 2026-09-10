import { Platform } from 'react-native';
import { FETCH_TIMEOUT_MS, USER_AGENT } from '../config';

export class FetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FetchError';
  }
}

export async function fetchText(
  url: string,
  extraHeaders: Record<string, string> = {},
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = { ...extraHeaders };
    // Browsers forbid User-Agent and strip unknown headers via CORS preflight.
    // Open-Meteo does not allow Api-User-Agent; only send identity headers on native.
    if (Platform.OS !== 'web') {
      headers['User-Agent'] = USER_AGENT;
      headers['Api-User-Agent'] = USER_AGENT;
    }

    const response = await fetch(url, {
      signal: controller.signal,
      headers,
    });

    if (!response.ok) {
      throw new FetchError(`HTTP ${response.status} for ${url}`);
    }

    return await response.text();
  } catch (error) {
    if (error instanceof FetchError) {
      throw error;
    }
    const reason = error instanceof Error ? error.message : 'network error';
    throw new FetchError(reason);
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson<T>(
  url: string,
  extraHeaders: Record<string, string> = {},
): Promise<T> {
  const body = await fetchText(url, extraHeaders);
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new FetchError(`Invalid JSON from ${url}`);
  }
}
