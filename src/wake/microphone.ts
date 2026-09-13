import { Platform } from 'react-native';
import { NestorMic, type AudioChunkEvent } from '../../modules/nestor-mic';

export type MicChunkHandler = (samples: number[], sampleRate: number) => void;

let gate: Promise<unknown> = Promise.resolve();

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const run = gate.then(work, work);
  gate = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function microphoneAvailable(): boolean {
  return Platform.OS === 'android' && NestorMic.available();
}

export async function startMicrophone(onChunk: MicChunkHandler): Promise<boolean> {
  return enqueue(async () => {
    if (!microphoneAvailable()) {
      return false;
    }

    await stopMicrophoneUnlocked();

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
      console.warn('Nestor: microphone failed to start', error);
      return false;
    }
  });
}

let activeStop: (() => Promise<void>) | null = null;

async function stopMicrophoneUnlocked(): Promise<void> {
  const stop = activeStop;
  activeStop = null;
  try {
    if (stop) {
      await stop();
    } else if (microphoneAvailable()) {
      await NestorMic.stop();
    }
  } catch (error) {
    console.warn('Nestor: microphone stop failed', error);
  }
}

export async function stopMicrophone(): Promise<void> {
  return enqueue(() => stopMicrophoneUnlocked());
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
