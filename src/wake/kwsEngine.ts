import { Platform } from 'react-native';
import { KWS_KEYWORDS_SCORE, KWS_KEYWORDS_THRESHOLD } from '../config';
import { normalizeKeyword } from './keywords';
import type { PreparedKwsModel } from './prepareModel';
import type { WakeKeywordId } from './types';

type KeywordStream = {
  acceptWaveform: (samples: number[], sampleRate?: number) => Promise<void>;
  isReady: () => Promise<boolean>;
  decode: () => Promise<void>;
  getResult: () => Promise<{ keyword?: string }>;
  reset: () => Promise<void>;
  destroy: () => Promise<void>;
};

type KeywordSpotter = {
  createStream: (keywords?: string) => Promise<KeywordStream>;
  destroy: () => Promise<void>;
};

let spotter: KeywordSpotter | null = null;
let stream: KeywordStream | null = null;

async function loadSherpa(): Promise<{
  createKeywordSpotter: (config: Record<string, unknown>) => Promise<KeywordSpotter>;
} | null> {
  if (Platform.OS !== 'android') {
    return null;
  }
  try {
    return await import('expo-sherpa-onnx');
  } catch (error) {
    if (__DEV__) {
      console.warn('Nestor: expo-sherpa-onnx is not available', error);
    }
    return null;
  }
}

export async function startKeywordSpotter(model: PreparedKwsModel): Promise<boolean> {
  await stopKeywordSpotter();

  const sherpa = await loadSherpa();
  if (!sherpa) {
    return false;
  }

  try {
    spotter = await sherpa.createKeywordSpotter({
      featConfig: {
        sampleRate: 16000,
        featureDim: 80,
      },
      modelConfig: {
        tokens: model.tokens,
        numThreads: 2,
        provider: 'cpu',
        modelType: 'zipformer2',
        transducer: {
          encoder: model.encoder,
          decoder: model.decoder,
          joiner: model.joiner,
        },
      },
      keywordsFile: model.keywords,
      keywordsScore: KWS_KEYWORDS_SCORE,
      keywordsThreshold: KWS_KEYWORDS_THRESHOLD,
      maxActivePaths: 4,
      numTrailingBlanks: 2,
    });
    stream = await spotter.createStream();
    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn('Nestor: keyword spotter failed to start', error);
    }
    await stopKeywordSpotter();
    return false;
  }
}

export async function acceptKwsSamples(samples: number[], sampleRate = 16000): Promise<WakeKeywordId | null> {
  if (!stream) {
    return null;
  }

  try {
    await stream.acceptWaveform(samples, sampleRate);
    let spotted: WakeKeywordId | null = null;
    while (await stream.isReady()) {
      await stream.decode();
      const result = await stream.getResult();
      const keyword = normalizeKeyword(result.keyword ?? '');
      if (keyword) {
        spotted = keyword;
        await stream.reset();
        break;
      }
    }
    return spotted;
  } catch (error) {
    if (__DEV__) {
      console.warn('Nestor: KWS decode failed', error);
    }
    return null;
  }
}

export async function stopKeywordSpotter(): Promise<void> {
  const activeStream = stream;
  const activeSpotter = spotter;
  stream = null;
  spotter = null;
  try {
    await activeStream?.destroy();
  } catch {
    // Already released.
  }
  try {
    await activeSpotter?.destroy();
  } catch {
    // Already released.
  }
}

export function keywordSpotterReady(): boolean {
  return stream != null;
}
