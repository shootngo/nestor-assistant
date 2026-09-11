/**
 * Resolve the kitchen brain key from env or Expo extra.
 * Never log the returned value.
 */
export function resolveKitchenBrainKey(
  env: Record<string, string | undefined> = typeof process === 'undefined' ? {} : process.env,
  extra = '',
): string {
  return (
    (env.EXPO_PUBLIC_GEMINI_API_KEY ?? '').trim() ||
    (env.GEMINI_API_KEY ?? '').trim() ||
    extra.trim()
  );
}

export function extraGeminiApiKey(extra: unknown): string {
  if (!extra || typeof extra !== 'object') {
    return '';
  }
  const value = (extra as { geminiApiKey?: unknown }).geminiApiKey;
  return typeof value === 'string' ? value.trim() : '';
}
