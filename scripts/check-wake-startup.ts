import { phaseAfterWakeInitFailure, type WakeInitFailureReason } from '../src/wake/startupPolicy.ts';

const stayIdle: WakeInitFailureReason[] = ['model-missing', 'spotter-failed', 'exception'];
const micCard: WakeInitFailureReason[] = ['mic-denied', 'mic-failed'];

let failed = 0;

function expect(label: string, actual: string, wanted: string) {
  if (actual !== wanted) {
    failed += 1;
    console.error(`fail: ${label} → ${actual} (wanted ${wanted})`);
  }
}

for (const reason of stayIdle) {
  expect(`idle after ${reason}`, phaseAfterWakeInitFailure(reason), 'idle');
}

for (const reason of micCard) {
  expect(`mic-needed after ${reason}`, phaseAfterWakeInitFailure(reason), 'mic-needed');
}

if (failed > 0) {
  console.error(`check-wake-startup: ${failed} failed`);
  process.exit(1);
}

console.log('check-wake-startup: ok');
