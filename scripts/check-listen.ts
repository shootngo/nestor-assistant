import { extraGeminiApiKey, resolveKitchenBrainKey } from '../src/listen/apiKey.ts';
import { isSleepUtterance, looksLikeRequest } from '../src/listen/request.ts';

const requests = [
  'how long to rest a roast',
  'what is the news',
  "what's a good chili recipe",
  'can you look up the weather in Southaven',
  'tell me why the sky is blue',
  'please find a roast recipe',
  'add milk to the list',
  "what's on the shopping list",
  "what's on the calendar today",
  'add a note to the calendar for tomorrow',
];

const chatter = ['yeah', 'hmm', 'wow', 'ok', 'thanks', 'the radio', 'uh'];

const sleep = ['goodbye nestor', 'good bye nestor', 'bye nestor', 'go to sleep', "that's all nestor"];

let failed = 0;

function expect(label: string, actual: boolean, wanted: boolean) {
  if (actual !== wanted) {
    failed += 1;
    console.error(`fail: ${label} → ${actual} (wanted ${wanted})`);
  }
}

for (const line of requests) {
  expect(`request: ${line}`, looksLikeRequest(line), true);
  expect(`not sleep: ${line}`, isSleepUtterance(line), false);
}

for (const line of chatter) {
  expect(`chatter: ${line}`, looksLikeRequest(line), false);
}

for (const line of sleep) {
  expect(`sleep: ${line}`, isSleepUtterance(line), true);
  expect(`sleep not request: ${line}`, looksLikeRequest(line), false);
}

function expectKey(label: string, actual: string, wanted: string) {
  if (actual !== wanted) {
    failed += 1;
    console.error(`fail: ${label} → ${JSON.stringify(actual)} (wanted ${JSON.stringify(wanted)})`);
  }
}

expectKey('plain GEMINI_API_KEY', resolveKitchenBrainKey({ GEMINI_API_KEY: 'plain-key' }), 'plain-key');
expectKey(
  'EXPO_PUBLIC wins',
  resolveKitchenBrainKey({ EXPO_PUBLIC_GEMINI_API_KEY: 'public-key', GEMINI_API_KEY: 'plain-key' }),
  'public-key',
);
expectKey('extra fallback', resolveKitchenBrainKey({}, 'extra-key'), 'extra-key');
expectKey('empty', resolveKitchenBrainKey({}), '');
expectKey('extra helper', extraGeminiApiKey({ geminiApiKey: 'from-extra' }), 'from-extra');
expectKey('extra empty', extraGeminiApiKey({ phase: 6 }), '');

if (failed > 0) {
  console.error(`check-listen: ${failed} failed`);
  process.exit(1);
}

console.log('check-listen: ok');
