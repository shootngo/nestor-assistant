import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  type Auth,
  type Persistence,
} from 'firebase/auth';
import { runtimeFirebaseConfig } from './runtime';

/**
 * Firebase Auth persistence backed by AsyncStorage so the fridge tablet
 * stays signed in across launches. Mirrors getReactNativePersistence without
 * relying on Metro picking the RN auth bundle during typecheck.
 */
function asyncStoragePersistence(): Persistence {
  return class {
    static type = 'LOCAL' as const;
    readonly type = 'LOCAL' as const;

    async _isAvailable(): Promise<boolean> {
      try {
        await AsyncStorage.setItem('__nestor_auth_ping', '1');
        await AsyncStorage.removeItem('__nestor_auth_ping');
        return true;
      } catch {
        return false;
      }
    }

    async _set(key: string, value: unknown): Promise<void> {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    }

    async _get<T>(key: string): Promise<T | null> {
      const json = await AsyncStorage.getItem(key);
      return json ? (JSON.parse(json) as T) : null;
    }

    async _remove(key: string): Promise<void> {
      await AsyncStorage.removeItem(key);
    }

    _addListener(): void {}

    _removeListener(): void {}
  } as unknown as Persistence;
}

export function getHouseholdApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(runtimeFirebaseConfig());
}

export function getHouseholdAuth(): Auth {
  const app = getHouseholdApp();
  try {
    return initializeAuth(app, {
      persistence: asyncStoragePersistence(),
    });
  } catch {
    return getAuth(app);
  }
}
