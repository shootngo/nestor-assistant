import { stopKeywordSpotter } from '../wake/kwsEngine';
import { stopMicrophone } from '../wake/microphone';

export {
  MIC_HANDOFF_MS,
  STT_BUSY_RESTART_MS,
  STT_ERROR_COOLDOWN_MS,
  STT_MAX_BURST,
  STT_RESTART_MS,
  TTS_HANDOFF_MS,
  kitchenSpeakText,
  shouldRetryStt,
  sttRestartDelay,
} from './sttGate';

let releaseChain: Promise<void> = Promise.resolve();

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Fully release the wake-word mic and keyword spotter so SpeechRecognizer
 * is the only audio client. Serialized — overlapping wake/listen stops
 * must not interleave start/stop on AudioRecord.
 */
export function releaseWakeAudio(): Promise<void> {
  releaseChain = releaseChain
    .catch(() => undefined)
    .then(async () => {
      await stopMicrophone();
      await stopKeywordSpotter();
    });
  return releaseChain;
}
