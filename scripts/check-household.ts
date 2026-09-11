import {
  extraFirebaseConfig,
  extraTabletEmail,
  extraTabletPassword,
  isHouseholdEmail,
  resolveFirebaseConfig,
  resolveTabletCredentials,
  NESTOR_FIREBASE_WEB,
} from '../src/household/config.ts';
import { addedShoppingLine, PRIVATE_REPLY } from '../src/household/copy.ts';
import { calendarBounds, chicagoYmd, normalizeCalendarRange, parseToolDate } from '../src/household/dates.ts';
import { isPrivateHouseholdAsk } from '../src/household/privacy.ts';
import { buildEventRecord, buildShoppingRecord } from '../src/household/records.ts';
import { createMemoryStore } from '../src/household/memoryStore.ts';
import { CALENDAR_VOICE_SCOPE } from '../src/household/calendar.ts';
import { executeHouseholdTool, HOUSEHOLD_TOOL_NAMES } from '../src/household/tools.ts';
import type { Actor } from '../src/household/types.ts';
import { collectFunctionCalls, functionResponseContent } from '../src/listen/geminiParts.ts';
import { looksLikeRequest } from '../src/listen/request.ts';

const actor: Actor = {
  uid: 'tablet-test',
  email: 'shootngo@gmail.com',
  displayName: 'Frank',
};

let failed = 0;

function expect(label: string, actual: unknown, wanted: unknown) {
  if (actual !== wanted) {
    failed += 1;
    console.error(`fail: ${label} → ${JSON.stringify(actual)} (wanted ${JSON.stringify(wanted)})`);
  }
}

expect('household email', isHouseholdEmail('ShootNGo@gmail.com'), true);
expect('jeannie', isHouseholdEmail('jeannie.newall@gmail.com'), true);
expect('stranger', isHouseholdEmail('other@example.com'), false);

const cfg = resolveFirebaseConfig({});
expect('firebase project', cfg.projectId, NESTOR_FIREBASE_WEB.projectId);
expect('firebase app', cfg.appId, NESTOR_FIREBASE_WEB.appId);
expect(
  'env override',
  resolveFirebaseConfig({ NESTOR_FIREBASE_PROJECT_ID: 'other-id' }).projectId,
  'other-id',
);

const creds = resolveTabletCredentials({
  NESTOR_TABLET_EMAIL: 'shootngo@gmail.com',
  NESTOR_TABLET_PASSWORD: 'secret-not-logged',
});
expect('tablet email', creds.email, 'shootngo@gmail.com');
expect('tablet password present', Boolean(creds.password), true);
expect('extra email', extraTabletEmail({ tabletEmail: 'shootngo@gmail.com' }), 'shootngo@gmail.com');
expect('extra password empty object', extraTabletPassword({ phase: 6 }), '');
expect('extra firebase project', extraFirebaseConfig({ firebase: NESTOR_FIREBASE_WEB })?.projectId, 'nestor-c2ae8');

const shop = buildShoppingRecord(actor, 'Milk', 'Dairy');
expect('shopping text', shop?.text, 'Milk');
expect('shopping aisle', shop?.aisle, 'Dairy');
expect('shopping notes', shop?.notes, '');
expect('shopping checked', shop?.checked, false);
expect('shopping createdBy email', shop?.createdBy.email, 'shootngo@gmail.com');
expect('shopping has createdAt', Boolean(shop?.createdAt), true);
expect('shopping has updatedAt', Boolean(shop?.updatedAt), true);
expect('shopping confirmation', addedShoppingLine('milk'), 'Added milk to the list.');

const event = buildEventRecord(actor, 'Take out recycling', '2026-09-11');
expect('event title', event?.title, 'Take out recycling');
expect('event date', event?.date, '2026-09-11');
expect('event notes', event?.notes, '');
expect('event billId', event?.billId, '');

expect('range today', normalizeCalendarRange('Today'), 'today');
expect('range week', normalizeCalendarRange('this week'), 'this_week');
expect('parse today', parseToolDate('today', new Date('2026-09-11T18:00:00-05:00')), chicagoYmd(new Date('2026-09-11T18:00:00-05:00')));

const week = calendarBounds('this_week', new Date('2026-09-11T18:00:00-05:00'));
expect('week start sunday', week.start, '2026-09-06');
expect('week end saturday', week.end, '2026-09-12');
const today = calendarBounds('today', new Date('2026-09-11T18:00:00-05:00'));
expect('today start', today.start, chicagoYmd(new Date('2026-09-11T18:00:00-05:00')));
expect('today end', today.end, today.start);

expect('private password', isPrivateHouseholdAsk("what's the wifi password"), true);
expect('private notes', isPrivateHouseholdAsk('read my notes'), true);
expect('private safe', isPrivateHouseholdAsk('what is the safe combo'), true);
expect('private emergency', isPrivateHouseholdAsk('read the emergency contacts'), true);
expect('private bills', isPrivateHouseholdAsk('how much is the power bill'), true);
expect('private bill due', isPrivateHouseholdAsk('when is the power bill due'), true);
expect('calendar note not private', isPrivateHouseholdAsk('add a note to the calendar for tomorrow'), false);
expect('shopping not private', isPrivateHouseholdAsk('add milk to the list'), false);
expect('privacy copy identity', PRIVATE_REPLY.includes('Gemini'), false);

expect('request add milk', looksLikeRequest('add milk to the list'), true);
expect('request list', looksLikeRequest("what's on the shopping list"), true);
expect('request calendar', looksLikeRequest("what's on the calendar today"), true);
expect('request add milk short', looksLikeRequest('add milk'), true);

expect('tool names', HOUSEHOLD_TOOL_NAMES.join(','), 'add_shopping_item,get_shopping_list,get_calendar,add_calendar_note');
expect('calendar scope skips bills', CALENDAR_VOICE_SCOPE.includes('bills' as never), false);
expect('calendar scope has events', CALENDAR_VOICE_SCOPE.includes('events'), true);

const calls = collectFunctionCalls([
  { text: 'unused' },
  { functionCall: { name: 'add_shopping_item', args: { item: 'milk' }, id: 'c1' } },
]);
expect('collect name', calls[0]?.name, 'add_shopping_item');
expect('collect item', calls[0]?.args.item, 'milk');
const response = functionResponseContent(calls, [{ ok: true, spoken: 'Added milk to the list.' }]);
expect('function response role', response.role, 'user');
expect('function response name', response.parts[0]?.functionResponse?.name, 'add_shopping_item');
expect('function response id', response.parts[0]?.functionResponse?.id, 'c1');

async function runTools() {
  const todayYmd = chicagoYmd();
  const week = calendarBounds('this_week');
  const store = createMemoryStore({
    events: [
      {
        id: 'e1',
        title: 'Take out recycling',
        date: todayYmd,
        notes: '',
        billId: '',
        createdBy: actor,
        createdAt: '2026-09-11T12:00:00.000Z',
        updatedBy: actor,
        updatedAt: '2026-09-11T12:00:00.000Z',
      },
    ],
    maintenance: [{ id: 'm1', name: 'Change HVAC filter', nextDue: week.end }],
    vehicles: [{ id: 'v1', name: 'CR-V' }],
    vehicleTasks: [{ id: 't1', vehicleId: 'v1', name: 'Oil change', nextDue: week.end }],
  });

  const added = await executeHouseholdTool(
    'add_shopping_item',
    { item: 'Milk', aisle: 'Dairy' },
    { store, actor },
  );
  expect('add ok', added.ok, true);
  expect('add spoken', added.spoken, 'Added Milk to the list (Dairy).');

  const listed = await executeHouseholdTool('get_shopping_list', {}, { store, actor });
  expect('list ok', listed.ok, true);
  expect('list spoken', listed.spoken, 'Milk');
  expect('list count', listed.data?.count, 1);

  const calToday = await executeHouseholdTool(
    'get_calendar',
    { range: 'today' },
    { store, actor },
  );
  expect('calendar today ok', calToday.ok, true);
  expect('calendar today has recycling', String(calToday.spoken).includes('Take out recycling'), true);
  expect('calendar today omits amount', String(JSON.stringify(calToday.data)).includes('typicalAmount'), false);

  const calWeek = await executeHouseholdTool('get_calendar', { range: 'this_week' }, { store, actor });
  expect('calendar week has vehicle', String(calWeek.spoken).includes('CR-V'), true);
  expect('calendar week has filter', String(calWeek.spoken).includes('HVAC'), true);

  const note = await executeHouseholdTool(
    'add_calendar_note',
    { text: 'Call the plumber', date: 'today' },
    { store, actor },
  );
  expect('note ok', note.ok, true);
  expect('note spoken has title', String(note.spoken).includes('Call the plumber'), true);

  const deniedStore = createMemoryStore();
  deniedStore.addShopping = async () => {
    const error = new Error('Missing or insufficient permissions.');
    (error as { code?: string }).code = 'permission-denied';
    throw error;
  };
  const denied = await executeHouseholdTool('add_shopping_item', { item: 'Eggs' }, { store: deniedStore, actor });
  expect('denied ok', denied.ok, false);
  expect('denied code', denied.error, 'permission-denied');
  expect('denied mentions rules', String(denied.spoken).toLowerCase().includes('rules'), true);

  return { added, listed, calToday, calWeek, note };
}

void runTools()
  .then((result) => {
    if (failed > 0) {
      console.error(`check-household: ${failed} failed`);
      process.exit(1);
    }
    console.log('check-household: ok');
    console.log(`add-item: ${result.added.spoken}`);
    console.log(`read-list: ${result.listed.spoken}`);
    console.log(`calendar today: ${result.calToday.spoken}`);
    console.log(`calendar week: ${result.calWeek.spoken}`);
    console.log(`calendar note: ${result.note.spoken}`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
