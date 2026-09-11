import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

export type SpeechTextEvent = {
  text: string;
};

export type SpeechErrorEvent = {
  code: number;
  message?: string;
};

export type TtsEvent = {
  id?: string;
};

type NativeVoice = {
  startListening: (preferOffline: boolean) => Promise<boolean>;
  stopListening: () => Promise<void>;
  cancelListening: () => Promise<void>;
  isSpeechAvailable: () => boolean;
  speak: (text: string, volume: number) => Promise<boolean>;
  stopSpeaking: () => Promise<void>;
  setMuted: (muted: boolean) => Promise<void>;
  nudgeStreamVolume: (direction: number) => Promise<void>;
  addListener: (
    eventName:
      | 'onSpeechBegin'
      | 'onSpeechEnd'
      | 'onSpeechResult'
      | 'onSpeechPartial'
      | 'onSpeechError'
      | 'onTtsStart'
      | 'onTtsDone'
      | 'onTtsError',
    listener: (event: SpeechTextEvent | SpeechErrorEvent | TtsEvent) => void,
  ) => { remove: () => void };
};

let native: NativeVoice | null | undefined;

function loadNative(): NativeVoice | null {
  if (native !== undefined) {
    return native;
  }
  if (Platform.OS !== 'android') {
    native = null;
    return null;
  }
  native = requireOptionalNativeModule<NativeVoice>('NestorVoice');
  return native;
}

export const NestorVoice = {
  available(): boolean {
    return loadNative() != null;
  },

  speechAvailable(): boolean {
    return loadNative()?.isSpeechAvailable() === true;
  },

  async startListening(preferOffline = true): Promise<boolean> {
    const module = loadNative();
    if (!module) {
      return false;
    }
    return module.startListening(preferOffline);
  },

  async stopListening(): Promise<void> {
    await loadNative()?.stopListening();
  },

  async cancelListening(): Promise<void> {
    await loadNative()?.cancelListening();
  },

  async speak(text: string, volume = 1): Promise<boolean> {
    const module = loadNative();
    if (!module) {
      return false;
    }
    return module.speak(text, volume);
  },

  async stopSpeaking(): Promise<void> {
    await loadNative()?.stopSpeaking();
  },

  async setMuted(muted: boolean): Promise<void> {
    await loadNative()?.setMuted(muted);
  },

  async nudgeStreamVolume(direction: number): Promise<void> {
    await loadNative()?.nudgeStreamVolume(direction);
  },

  addListener(
    eventName: Parameters<NativeVoice['addListener']>[0],
    listener: (event: SpeechTextEvent | SpeechErrorEvent | TtsEvent) => void,
  ): { remove: () => void } {
    const module = loadNative();
    if (!module) {
      return { remove() {} };
    }
    return module.addListener(eventName, listener);
  },
};
