/**
 * Public web config for Firebase project nestor-c2ae8 (same as shootngo/Nestor).
 * These values are not secrets. Tablet email/password stay in env / EAS secrets.
 */
export const NESTOR_FIREBASE_WEB = {
  apiKey: 'AIzaSyDIOkUTuXQ7vQHoUdC23CX2M_ihwHI6QKU',
  authDomain: 'nestor-c2ae8.firebaseapp.com',
  projectId: 'nestor-c2ae8',
  storageBucket: 'nestor-c2ae8.firebasestorage.app',
  messagingSenderId: '487623313396',
  appId: '1:487623313396:web:bbcd15fc7608465c5a1ba1',
} as const;

/** Must match shootngo/Nestor firestore.rules (case-insensitive). */
export const HOUSEHOLD_EMAILS = ['shootngo@gmail.com', 'jeannie.newall@gmail.com'] as const;

export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

export type TabletCredentials = {
  email: string;
  password: string;
};

function trimEnv(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function pickEnv(
  env: Record<string, string | undefined>,
  names: readonly string[],
): string {
  for (const name of names) {
    const value = trimEnv(env[name]);
    if (value) {
      return value;
    }
  }
  return '';
}

export function isHouseholdEmail(email: string): boolean {
  const value = email.trim().toLowerCase();
  return HOUSEHOLD_EMAILS.some((allowed) => allowed === value);
}

export function resolveFirebaseConfig(
  env: Record<string, string | undefined> = typeof process === 'undefined' ? {} : process.env,
  extra?: Partial<FirebaseWebConfig> | null,
): FirebaseWebConfig {
  return {
    apiKey:
      pickEnv(env, ['EXPO_PUBLIC_NESTOR_FIREBASE_API_KEY', 'NESTOR_FIREBASE_API_KEY']) ||
      trimEnv(extra?.apiKey) ||
      NESTOR_FIREBASE_WEB.apiKey,
    authDomain:
      pickEnv(env, ['EXPO_PUBLIC_NESTOR_FIREBASE_AUTH_DOMAIN', 'NESTOR_FIREBASE_AUTH_DOMAIN']) ||
      trimEnv(extra?.authDomain) ||
      NESTOR_FIREBASE_WEB.authDomain,
    projectId:
      pickEnv(env, ['EXPO_PUBLIC_NESTOR_FIREBASE_PROJECT_ID', 'NESTOR_FIREBASE_PROJECT_ID']) ||
      trimEnv(extra?.projectId) ||
      NESTOR_FIREBASE_WEB.projectId,
    storageBucket:
      pickEnv(env, ['EXPO_PUBLIC_NESTOR_FIREBASE_STORAGE_BUCKET', 'NESTOR_FIREBASE_STORAGE_BUCKET']) ||
      trimEnv(extra?.storageBucket) ||
      NESTOR_FIREBASE_WEB.storageBucket,
    messagingSenderId:
      pickEnv(env, [
        'EXPO_PUBLIC_NESTOR_FIREBASE_MESSAGING_SENDER_ID',
        'NESTOR_FIREBASE_MESSAGING_SENDER_ID',
      ]) ||
      trimEnv(extra?.messagingSenderId) ||
      NESTOR_FIREBASE_WEB.messagingSenderId,
    appId:
      pickEnv(env, ['EXPO_PUBLIC_NESTOR_FIREBASE_APP_ID', 'NESTOR_FIREBASE_APP_ID']) ||
      trimEnv(extra?.appId) ||
      NESTOR_FIREBASE_WEB.appId,
  };
}

export function resolveTabletCredentials(
  env: Record<string, string | undefined> = typeof process === 'undefined' ? {} : process.env,
  extraEmail = '',
  extraPassword = '',
): TabletCredentials {
  return {
    email:
      pickEnv(env, ['EXPO_PUBLIC_NESTOR_TABLET_EMAIL', 'NESTOR_TABLET_EMAIL']) || extraEmail.trim(),
    password:
      pickEnv(env, ['EXPO_PUBLIC_NESTOR_TABLET_PASSWORD', 'NESTOR_TABLET_PASSWORD']) ||
      extraPassword.trim(),
  };
}

export function extraFirebaseConfig(extra: unknown): Partial<FirebaseWebConfig> | null {
  if (!extra || typeof extra !== 'object') {
    return null;
  }
  const firebase = (extra as { firebase?: unknown }).firebase;
  if (!firebase || typeof firebase !== 'object') {
    return null;
  }
  const value = firebase as Record<string, unknown>;
  return {
    apiKey: trimEnv(value.apiKey),
    authDomain: trimEnv(value.authDomain),
    projectId: trimEnv(value.projectId),
    storageBucket: trimEnv(value.storageBucket),
    messagingSenderId: trimEnv(value.messagingSenderId),
    appId: trimEnv(value.appId),
  };
}

export function extraTabletEmail(extra: unknown): string {
  if (!extra || typeof extra !== 'object') {
    return '';
  }
  return trimEnv((extra as { tabletEmail?: unknown }).tabletEmail);
}

export function extraTabletPassword(extra: unknown): string {
  if (!extra || typeof extra !== 'object') {
    return '';
  }
  return trimEnv((extra as { tabletPassword?: unknown }).tabletPassword);
}
