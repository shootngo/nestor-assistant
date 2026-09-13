let muted = false;
let volume = 1;

export function getSessionMuted(): boolean {
  return muted;
}

export function getSessionVolume(): number {
  return volume;
}

export function persistMuted(next: boolean): void {
  muted = next;
}

export function persistVolume(next: number): void {
  volume = Math.min(1, Math.max(0.05, next));
}

export const TTS_VOLUME_STEP = 0.15;

export {
  MIC_HANDOFF_MS,
  STT_RESTART_MS,
  TTS_HANDOFF_MS,
} from './audioHandoff';
