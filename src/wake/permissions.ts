import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import { Platform } from 'react-native';
import type { MicPermission } from './types';

export async function getMicPermission(): Promise<MicPermission> {
  if (Platform.OS !== 'android') {
    return 'unavailable';
  }
  try {
    const result = await getRecordingPermissionsAsync();
    return result.granted ? 'granted' : 'denied';
  } catch {
    return 'unknown';
  }
}

export async function requestMicPermission(): Promise<MicPermission> {
  if (Platform.OS !== 'android') {
    return 'unavailable';
  }
  try {
    const result = await requestRecordingPermissionsAsync();
    return result.granted ? 'granted' : 'denied';
  } catch (error) {
    if (__DEV__) {
      console.warn('Nestor: mic permission request failed', error);
    }
    return 'denied';
  }
}
