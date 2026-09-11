import { Platform } from 'react-native';
import { NestorVoice } from '../../modules/nestor-voice';

export function kitchenVoiceAvailable(): boolean {
  return Platform.OS === 'android' && NestorVoice.available();
}

export function kitchenSpeechAvailable(): boolean {
  return kitchenVoiceAvailable() && NestorVoice.speechAvailable();
}

export async function startUtteranceCapture(preferOffline = true): Promise<boolean> {
  if (!kitchenVoiceAvailable()) {
    return false;
  }
  try {
    return await NestorVoice.startListening(preferOffline);
  } catch (error) {
    if (__DEV__) {
      console.warn('Nestor: speech capture failed', error);
    }
    return false;
  }
}

export async function stopUtteranceCapture(): Promise<void> {
  try {
    await NestorVoice.cancelListening();
  } catch {
    // already stopped
  }
}

export async function speakAnswer(text: string, volume: number): Promise<boolean> {
  if (!kitchenVoiceAvailable() || !text.trim()) {
    return false;
  }
  try {
    return await NestorVoice.speak(text, volume);
  } catch (error) {
    if (__DEV__) {
      console.warn('Nestor: speech out failed', error);
    }
    return false;
  }
}

export async function stopSpeaking(): Promise<void> {
  try {
    await NestorVoice.stopSpeaking();
  } catch {
    // already stopped
  }
}

export async function setNativeMuted(muted: boolean): Promise<void> {
  try {
    await NestorVoice.setMuted(muted);
  } catch {
    // web / missing module
  }
}

export async function nudgeTabletVolume(direction: 1 | -1): Promise<void> {
  try {
    await NestorVoice.nudgeStreamVolume(direction);
  } catch {
    // web / missing module
  }
}

export function readingMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(12_000, Math.max(1800, words * 320));
}

export const NestorVoiceEvents = NestorVoice;
