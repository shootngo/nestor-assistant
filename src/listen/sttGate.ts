/** Hard cap on SpeechRecognizer starts per wake. More than this is the beep loop. */
export const STT_MAX_STARTS_PER_WAKE = 2;

/** Ignore KWS hits this long after the spotter comes up (startup / fridge noise). */
export const KWS_STARTUP_GRACE_MS = 1500;

let armed = false;
let starts = 0;
let kwsLiveAt = 0;

/** Call only from a confirmed wake or tap-to-wake. Cold start must not arm. */
export function armSttForWake(): void {
  armed = true;
  starts = 0;
}

export function disarmStt(): void {
  armed = false;
}

export function isSttArmed(): boolean {
  return armed;
}

export function sttStartsUsed(): number {
  return starts;
}

/** Reserve one start. False if cold / disarmed / already used up. */
export function noteSttStart(): boolean {
  if (!armed) {
    return false;
  }
  if (starts >= STT_MAX_STARTS_PER_WAKE) {
    return false;
  }
  starts += 1;
  return true;
}

export function markKwsLive(): void {
  kwsLiveAt = Date.now();
}

export function kwsAcceptsWake(now = Date.now()): boolean {
  if (kwsLiveAt <= 0) {
    return false;
  }
  return now - kwsLiveAt >= KWS_STARTUP_GRACE_MS;
}

export function nextSttAction(startsUsed: number, code = 0): 'retry' | 'idle' {
  if (code === 9) {
    return 'idle';
  }
  if (startsUsed >= STT_MAX_STARTS_PER_WAKE) {
    return 'idle';
  }
  return 'retry';
}

/**
 * How long to wait after AudioRecord / sherpa release before SpeechRecognizer
 * may own the mic. 220ms was too short on the Tab A (beep-beep restart loop).
 */
export const MIC_HANDOFF_MS = 700;

/** Minimum gap between SpeechRecognizer starts. Stops the system beep loop. */
export const STT_RESTART_MS = 1800;

export const STT_BUSY_RESTART_MS = 2400;

export const STT_ERROR_COOLDOWN_MS = 4000;

/** After this many starts, stop and return to the idle board. */
export const STT_MAX_BURST = STT_MAX_STARTS_PER_WAKE;

/** Pause after destroying STT before TTS speaks (Samsung audio HAL). */
export const TTS_HANDOFF_MS = 400;

export function sttRestartDelay(code: number, burst: number): number {
  if (burst >= STT_MAX_BURST) {
    return STT_ERROR_COOLDOWN_MS;
  }
  if (code === 8) {
    return STT_BUSY_RESTART_MS;
  }
  if (code === 3 || code === 5) {
    return MIC_HANDOFF_MS + 500;
  }
  if (code === 9) {
    return STT_ERROR_COOLDOWN_MS;
  }
  return STT_RESTART_MS;
}

export function shouldRetryStt(code: number, startsUsed: number): boolean {
  if (code === 9) {
    return false;
  }
  return startsUsed < STT_MAX_BURST;
}

/** Strip control characters and cap length so TTS engines on old Tabs do not abort. */
export function kitchenSpeakText(raw: string): string {
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 800);
}
