import Constants from 'expo-constants';
import {
  extraFirebaseConfig,
  extraTabletEmail,
  extraTabletPassword,
  resolveFirebaseConfig,
  resolveTabletCredentials,
  type FirebaseWebConfig,
  type TabletCredentials,
} from './config';

export function runtimeFirebaseConfig(): FirebaseWebConfig {
  return resolveFirebaseConfig(process.env, extraFirebaseConfig(Constants.expoConfig?.extra));
}

export function runtimeTabletCredentials(): TabletCredentials {
  const extra = Constants.expoConfig?.extra;
  return resolveTabletCredentials(process.env, extraTabletEmail(extra), extraTabletPassword(extra));
}
