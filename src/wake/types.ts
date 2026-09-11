export type WakePhase = 'idle' | 'listening' | 'exiting' | 'mic-needed';

export type WakeKeywordId = 'nestor' | 'hey_nestor' | 'goodbye_nestor';

export type KwsDetection = {
  keyword: string;
};

export type MicPermission = 'unknown' | 'granted' | 'denied' | 'unavailable';
