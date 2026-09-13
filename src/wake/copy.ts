import { WAKE_PHRASE } from '../config';

export const LISTENING_LINE = 'Listening…';

export const DISMISS_LINE = 'Say Goodbye Nestor to dismiss';

export const MIC_TITLE = 'Nestor needs the microphone';

export const MIC_BODY =
  'Allow the microphone so Nestor can hear you. The kitchen board stays up either way — you can also tap Talk to Nestor.';

export const MIC_RETRY = 'Allow the microphone';

export const MIC_CONTINUE = 'Continue to the kitchen board';

export const TAP_TO_WAKE_LABEL = 'Talk to Nestor';

export const TAP_TO_WAKE_HINT = 'Or say Nestor';

export function wakeSpokenLabel(phrase: typeof WAKE_PHRASE = WAKE_PHRASE): string {
  return phrase === 'hey_nestor' ? 'Hey Nestor' : 'Nestor';
}
