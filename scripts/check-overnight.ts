import {
  OVERNIGHT_DIM_END_HOUR,
  OVERNIGHT_DIM_START_HOUR,
  OVERNIGHT_TTS_CAP,
  OVERNIGHT_TTS_SCALE,
} from '../src/config';
import { parseClockLabel, splitClockTime } from '../src/overnight/clock';
import { isOvernightHour, nightSpeakVolume } from '../src/overnight/window';
import { householdClockParts, householdHour } from '../src/time';

let failed = 0;

function expect(label: string, actual: unknown, wanted: unknown) {
  if (actual !== wanted) {
    failed += 1;
    console.error(`fail: ${label} → ${JSON.stringify(actual)} (wanted ${JSON.stringify(wanted)})`);
  }
}

expect('default start', OVERNIGHT_DIM_START_HOUR, 22);
expect('default end', OVERNIGHT_DIM_END_HOUR, 6);

const wrapCases: Array<[number, boolean]> = [
  [21, false],
  [22, true],
  [23, true],
  [0, true],
  [5, true],
  [6, false],
  [12, false],
];

for (const [hour, wanted] of wrapCases) {
  expect(`wrap ${hour}`, isOvernightHour(hour), wanted);
}

expect('same-day 1–5 at 0', isOvernightHour(0, 1, 5), false);
expect('same-day 1–5 at 1', isOvernightHour(1, 1, 5), true);
expect('same-day 1–5 at 4', isOvernightHour(4, 1, 5), true);
expect('same-day 1–5 at 5', isOvernightHour(5, 1, 5), false);
expect('disabled equal hours', isOvernightHour(22, 7, 7), false);

expect('day volume unchanged', nightSpeakVolume(1, false), 1);
expect('night volume scaled', nightSpeakVolume(1, true), Math.max(0.08, Math.min(OVERNIGHT_TTS_CAP, 1 * OVERNIGHT_TTS_SCALE)));
expect('night volume capped', nightSpeakVolume(1, true) <= OVERNIGHT_TTS_CAP, true);
expect('mute path stays silent caller-side', nightSpeakVolume(0.2, true) < 0.2, true);

const parsed = parseClockLabel('10:42 PM');
expect('parse time', parsed?.time, '10:42');
expect('parse period', parsed?.period, 'PM');
expect('parse clock only', parseClockLabel('6:00')?.time, '6:00');
expect('parse reject', parseClockLabel('late'), null);
expect('split hour', splitClockTime('10:42').hour, '10');
expect('split minute', splitClockTime('10:42').minute, '42');

const chicagoNoon = new Date('2026-09-12T17:00:00.000Z'); // 12:00 America/Chicago (CDT)
expect('chicago noon hour', householdHour(chicagoNoon), 12);
expect('chicago noon not overnight', isOvernightHour(householdHour(chicagoNoon)), false);

const chicagoNight = new Date('2026-09-13T04:42:00.000Z'); // 23:42 Saturday America/Chicago
expect('chicago 11pm hour', householdHour(chicagoNight), 23);
expect('chicago 11pm overnight', isOvernightHour(householdHour(chicagoNight)), true);
expect('chicago 11pm clock', householdClockParts(chicagoNight).time, '11:42');
expect('chicago 11pm period', householdClockParts(chicagoNight).period, 'PM');

const chicagoDawn = new Date('2026-09-13T11:00:00.000Z'); // 06:00 Sunday America/Chicago
expect('chicago 6am hour', householdHour(chicagoDawn), 6);
expect('chicago 6am day', isOvernightHour(householdHour(chicagoDawn)), false);

if (failed > 0) {
  console.error(`check-overnight: ${failed} failed`);
  process.exit(1);
}

console.log('check-overnight: ok');
