import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

export type AudioChunkEvent = {
  samples: number[];
  sampleRate: number;
};

type NativeMic = {
  start: (sampleRate: number) => Promise<void>;
  stop: () => Promise<void>;
  addListener: (eventName: 'onAudio', listener: (event: AudioChunkEvent) => void) => {
    remove: () => void;
  };
};

let native: NativeMic | null | undefined;

function loadNative(): NativeMic | null {
  if (native !== undefined) {
    return native;
  }
  if (Platform.OS !== 'android') {
    native = null;
    return null;
  }
  native = requireOptionalNativeModule<NativeMic>('NestorMic');
  return native;
}

export const NestorMic = {
  available(): boolean {
    return loadNative() != null;
  },

  async start(sampleRate = 16000): Promise<boolean> {
    const module = loadNative();
    if (!module) {
      return false;
    }
    await module.start(sampleRate);
    return true;
  },

  async stop(): Promise<void> {
    await loadNative()?.stop();
  },

  addListener(listener: (event: AudioChunkEvent) => void): { remove: () => void } {
    const module = loadNative();
    if (!module) {
      return { remove() {} };
    }
    return module.addListener('onAudio', listener);
  },
};
