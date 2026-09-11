const BACKCHANNEL =
  /^(um+|uh+|ah+|oh+|hmm+|mm+|mhm+|huh|wow|whoa|yeah|yep|yup|nah|nope|ok|okay|right|sure|fine|thanks|thank you|hi|hey|hello|hey there|good morning|good afternoon|good evening|good night|morning|night)$/i;

const QUESTION_START =
  /^(who|what|when|where|why|how|which|whose|whom|is|are|am|was|were|can|could|would|will|should|do|does|did|may|might|tell|give|find|look|search|show|explain|remind|make|cook|bake|rest|please)\b/;

const REQUEST_HINT =
  /\b(recipe|recipes|ingredient|ingredients|news|headline|weather|forecast|how long|how much|how many|what is|what's|whats|what are|tell me|look up|look that|can you|could you|would you|please|i need|i want|i'd like|id like|help me|rest a roast|roast|temperature|timer|minutes?|hours?|mean|meaning|why is|who (is|was|won)|latest)\b/;

const SLEEP_UTTERANCE =
  /^(hey |ok |okay )?(nestor,? )?(goodbye|good bye|bye|good night|go to sleep|go back to sleep|that's all|thats all|that is all|we'?re done|we are done)(,?\s+nestor)?[.!?]*$/;

export function normalizeUtterance(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[“”"'`]/g, '')
    .replace(/[^\w\s?']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isSleepUtterance(raw: string): boolean {
  const text = normalizeUtterance(raw);
  if (!text) {
    return false;
  }
  if (SLEEP_UTTERANCE.test(text)) {
    return true;
  }
  return text === 'goodbye nestor' || text === 'good bye nestor' || text === 'bye nestor';
}

export function looksLikeRequest(raw: string): boolean {
  const text = normalizeUtterance(raw);
  if (!text || isSleepUtterance(text)) {
    return false;
  }
  if (BACKCHANNEL.test(text)) {
    return false;
  }
  const words = text.split(' ').filter(Boolean);
  if (words.length === 0) {
    return false;
  }
  if (text.includes('?')) {
    return true;
  }
  if (QUESTION_START.test(text) || REQUEST_HINT.test(text)) {
    return true;
  }
  if (words.length >= 6) {
    return true;
  }
  return false;
}
