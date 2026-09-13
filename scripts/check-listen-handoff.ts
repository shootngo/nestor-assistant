import {
  MIC_HANDOFF_MS,
  STT_ERROR_COOLDOWN_MS,
  STT_MAX_BURST,
  STT_MAX_STARTS_PER_WAKE,
  STT_RESTART_MS,
  armSttForWake,
  disarmStt,
  isSttArmed,
  kitchenSpeakText,
  kwsAcceptsWake,
  markKwsLive,
  nextSttAction,
  noteSttStart,
  shouldRetryStt,
  sttRestartDelay,
  sttStartsUsed,
} from '../src/listen/sttGate.ts';
import { KEYWORD_THRESHOLD, keywordsFileContents } from '../src/wake/keywords.ts';

let failed = 0;

function expect(label: string, actual: unknown, wanted: unknown) {
  if (actual !== wanted) {
    failed += 1;
    console.error(`fail: ${label} → ${JSON.stringify(actual)} (wanted ${JSON.stringify(wanted)})`);
  }
}

function expectTrue(label: string, actual: boolean) {
  expect(label, actual, true);
}

expect('handoff longer than old 220ms', MIC_HANDOFF_MS > 220, true);
expect('restart longer than old 320ms', STT_RESTART_MS > 320, true);
expect('max starts is small', STT_MAX_STARTS_PER_WAKE <= 2, true);
expect('burst matches cap', STT_MAX_BURST, 2);

disarmStt();
expect('cold start not armed', isSttArmed(), false);
expect('cold start cannot note start', noteSttStart(), false);

armSttForWake();
expect('armed after wake', isSttArmed(), true);
expect('first start allowed', noteSttStart(), true);
expect('second start allowed', noteSttStart(), true);
expect('third start blocked', noteSttStart(), false);
expect('starts used', sttStartsUsed(), 2);
expect('no retry after cap', shouldRetryStt(7, sttStartsUsed()), false);
expect('give up after cap', nextSttAction(sttStartsUsed(), 7), 'idle');

armSttForWake();
expect('wake resets starts', sttStartsUsed(), 0);
expect('retry while under cap', shouldRetryStt(6, 1), true);
expect('permission gives up', nextSttAction(0, 9), 'idle');
expect('busy backs off', sttRestartDelay(8, 0) >= 2000, true);
expect('audio/client waits for mic', sttRestartDelay(3, 0) >= MIC_HANDOFF_MS, true);
expect('burst cools down', sttRestartDelay(7, STT_MAX_BURST), STT_ERROR_COOLDOWN_MS);

disarmStt();
expect('disarmed', isSttArmed(), false);

expect('kws closed before live', kwsAcceptsWake(1_000), false);
markKwsLive();
const now = Date.now();
expect('kws grace holds', kwsAcceptsWake(now + 200), false);
expect('kws grace lifts', kwsAcceptsWake(now + 1600), true);

expect('speak strips controls', kitchenSpeakText('hello\u0007 kitchen'), 'hello kitchen');
expect('speak caps length', kitchenSpeakText('x'.repeat(1200)).length, 800);
expect('speak trims', kitchenSpeakText('  Rest a roast.  '), 'Rest a roast.');

const keywords = keywordsFileContents('nestor');
expectTrue('keywords include nestor', keywords.includes('@nestor'));
expectTrue('keywords include hey_nestor', keywords.includes('@hey_nestor'));
expectTrue('keywords include goodbye', keywords.includes('@goodbye_nestor'));
expectTrue('kitchen nestor threshold eased', KEYWORD_THRESHOLD.nestor < 0.42);
expectTrue('kitchen hey threshold eased', KEYWORD_THRESHOLD.hey_nestor < 0.28);

if (failed > 0) {
  console.error(`check-listen-handoff: ${failed} failed`);
  process.exit(1);
}

console.log('check-listen-handoff: ok');
