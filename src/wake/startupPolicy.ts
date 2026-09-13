import type { WakePhase } from './types';

export type WakeInitFailureReason =
  | 'mic-denied'
  | 'mic-failed'
  | 'model-missing'
  | 'spotter-failed'
  | 'exception';

/**
 * Wake-engine failures must not take down the kitchen board.
 * Only a real microphone denial (or a granted-but-dead AudioRecord) uses the
 * existing mic-needed card. Sherpa / model / unexpected errors stay idle.
 */
export function phaseAfterWakeInitFailure(reason: WakeInitFailureReason): WakePhase {
  if (reason === 'mic-denied' || reason === 'mic-failed') {
    return 'mic-needed';
  }
  return 'idle';
}
