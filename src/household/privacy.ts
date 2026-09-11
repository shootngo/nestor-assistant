function normalize(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[“”"'`]/g, '')
    .replace(/[^\w\s?']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
/**
 * Voice must never read or write private notes, passwords, the safe,
 * emergency info, or bills / payment secrets. Calendar notes are not private notes.
 */
const PRIVATE_TOPIC =
  /\b(passwords?|pass ?codes?|pin codes?|wifi (password|pass|pin)|safe( ?combo| combination| code)?|combination to the safe|\bthe safe\b|emergency (info|information|contacts?)|ice contacts?|private notes?|secret notes?|hidden notes?|my notes|the notes app|account numbers?|routing numbers?|social security|\bssn\b)\b/;

const BILL_ASK =
  /\b((show|read|tell|list|what'?s|whats|what is|how much|pay|paying|paid).{0,40}\bbills?\b|\bbills?\b.{0,24}\b(due|amount|paid|payment|typical|secret)|\bbill amounts?|payment (amount|secrets?|details?)|typical amount)\b/;

export function isPrivateHouseholdAsk(raw: string): boolean {
  const text = normalize(raw);
  if (!text) {
    return false;
  }
  if (PRIVATE_TOPIC.test(text)) {
    return true;
  }
  return BILL_ASK.test(text);
}
