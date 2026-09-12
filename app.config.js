/**
 * Kitchen keys for Metro / EAS / local `.env`.
 * Gemini: EXPO_PUBLIC_GEMINI_API_KEY or GEMINI_API_KEY
 * Tablet sign-in: NESTOR_TABLET_EMAIL + NESTOR_TABLET_PASSWORD
 *   (or EXPO_PUBLIC_ variants). Never log or commit the password.
 * Firebase web config defaults to public nestor-c2ae8 keys; override with NESTOR_FIREBASE_*.
 */
function pickEnv(...names) {
  for (const name of names) {
    const value = String(process.env[name] ?? '').trim();
    if (value) {
      return value;
    }
  }
  return '';
}

function resolveKitchenBrainKey() {
  return pickEnv('EXPO_PUBLIC_GEMINI_API_KEY', 'GEMINI_API_KEY');
}

const NESTOR_FIREBASE_WEB = {
  apiKey: 'AIzaSyDIOkUTuXQ7vQHoUdC23CX2M_ihwHI6QKU',
  authDomain: 'nestor-c2ae8.firebaseapp.com',
  projectId: 'nestor-c2ae8',
  storageBucket: 'nestor-c2ae8.firebasestorage.app',
  messagingSenderId: '487623313396',
  appId: '1:487623313396:web:bbcd15fc7608465c5a1ba1',
};

const kitchenBrainKey = resolveKitchenBrainKey();
if (kitchenBrainKey && !String(process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '').trim()) {
  process.env.EXPO_PUBLIC_GEMINI_API_KEY = kitchenBrainKey;
}

const tabletEmail = pickEnv('EXPO_PUBLIC_NESTOR_TABLET_EMAIL', 'NESTOR_TABLET_EMAIL');
const tabletPassword = pickEnv('EXPO_PUBLIC_NESTOR_TABLET_PASSWORD', 'NESTOR_TABLET_PASSWORD');

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    phase: 6,
    geminiApiKey: kitchenBrainKey,
    firebase: {
      apiKey: pickEnv('EXPO_PUBLIC_NESTOR_FIREBASE_API_KEY', 'NESTOR_FIREBASE_API_KEY') || NESTOR_FIREBASE_WEB.apiKey,
      authDomain:
        pickEnv('EXPO_PUBLIC_NESTOR_FIREBASE_AUTH_DOMAIN', 'NESTOR_FIREBASE_AUTH_DOMAIN') ||
        NESTOR_FIREBASE_WEB.authDomain,
      projectId:
        pickEnv('EXPO_PUBLIC_NESTOR_FIREBASE_PROJECT_ID', 'NESTOR_FIREBASE_PROJECT_ID') ||
        NESTOR_FIREBASE_WEB.projectId,
      storageBucket:
        pickEnv('EXPO_PUBLIC_NESTOR_FIREBASE_STORAGE_BUCKET', 'NESTOR_FIREBASE_STORAGE_BUCKET') ||
        NESTOR_FIREBASE_WEB.storageBucket,
      messagingSenderId:
        pickEnv('EXPO_PUBLIC_NESTOR_FIREBASE_MESSAGING_SENDER_ID', 'NESTOR_FIREBASE_MESSAGING_SENDER_ID') ||
        NESTOR_FIREBASE_WEB.messagingSenderId,
      appId: pickEnv('EXPO_PUBLIC_NESTOR_FIREBASE_APP_ID', 'NESTOR_FIREBASE_APP_ID') || NESTOR_FIREBASE_WEB.appId,
    },
    tabletEmail,
    tabletPassword,
  },
});
