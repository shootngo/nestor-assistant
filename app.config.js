/**
 * Kitchen brain key for Metro / EAS / local `.env`.
 * Accepts EXPO_PUBLIC_GEMINI_API_KEY (Expo client inline) or GEMINI_API_KEY
 * (Frank’s Grok box / EAS secret / plain .env). Never log the value.
 */
function resolveKitchenBrainKey() {
  const fromPublic = String(process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '').trim();
  const fromPlain = String(process.env.GEMINI_API_KEY ?? '').trim();
  return fromPublic || fromPlain;
}

const kitchenBrainKey = resolveKitchenBrainKey();
if (kitchenBrainKey && !String(process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '').trim()) {
  process.env.EXPO_PUBLIC_GEMINI_API_KEY = kitchenBrainKey;
}

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    geminiApiKey: kitchenBrainKey,
  },
});
