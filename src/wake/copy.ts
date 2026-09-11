import { WAKE_PHRASE } from '../config';

export const LISTENING_LINE = 'Listening…';

export const DISMISS_LINE = 'Say Goodbye Nestor to dismiss';

export const MIC_TITLE = 'Nestor needs the microphone';

export const MIC_BODY =
  'The kitchen board is still here. Allow the mic so Nestor can wake when you say his name.';

export const MIC_RETRY = 'Try the microphone again';

export const MIC_CONTINUE = 'Continue to the kitchen board';

export function wakeSpokenLabel(phrase: typeof WAKE_PHRASE = WAKE_PHRASE): string {
  return phrase === 'hey_nestor' ? 'Hey Nestor' : 'Nestor';
}
