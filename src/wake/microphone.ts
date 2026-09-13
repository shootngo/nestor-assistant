import { Platform } from 'react-native';
import { NestorMic, type AudioChunkEvent } from '../../modules/nestor-mic';

export type MicChunkHandler = (samples: number[], sampleRate: number) => void;

export function microphoneAvailable(): boolean {
  return Platform.OS === 'android' && NestorMic.available();
}

export async function startMicrophone(onChunk: MicChunkHandler): Promise<boolean> {
  if (!microphoneAvailable()) {
    return false;
  }

  const subscription = NestorMic.addListener((event: AudioChunkEvent) => {
    if (!event?.samples?.length) {
      return;
    }
    onChunk(event.samples, event.sampleRate || 16000);
  });

  try {
    const started = await NestorMic.start(16000);
    if (!started) {
      subscription.remove();
      return false;
    }
    activeStop = async () => {
      subscription.remove();
      await NestorMic.stop();
    };
    return true;
  } catch (error) {
    subscription.remove();
    if (__DEV__) {
      console.warn('Nestor: microphone failed to start', error);
    }
    return false;
  }
}

let activeStop: (() => Promise<void>) | null = null;

export async function stopMicrophone(): Promise<void> {
  const stop = activeStop;
  activeStop = null;
  try {
    if (stop) {
      await stop();
    } else if (microphoneAvailable()) {
      await NestorMic.stop();
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('Nestor: microphone stop failed', error);
    }
  }
}

export function pcmRms(samples: number[]): number {
  if (samples.length === 0) {
    return 0;
  }
  let sum = 0;
  for (const sample of samples) {
    sum += sample * sample;
  }
  return Math.sqrt(sum / samples.length);
}
