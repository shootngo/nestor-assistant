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
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: '*/*',
        'Api-User-Agent': USER_AGENT,
        ...extraHeaders,
      },
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
