import { addCalendarNote, getCalendar } from './calendar';
import { HOUSEHOLD_NETWORK_REPLY, RULES_DENIED_REPLY } from './copy';
import { addShoppingItem, getShoppingList } from './shopping';
import type { Actor, HouseholdStore, ToolResult } from './types';

export const HOUSEHOLD_FUNCTION_DECLARATIONS = [
  {
    name: 'add_shopping_item',
    description:
      'Add one grocery or to-do item to the household shopping list. Confirm out loud after a successful add.',
    parameters: {
      type: 'object',
      properties: {
        item: {
          type: 'string',
          description: 'Item to add, e.g. milk or bananas.',
        },
        aisle: {
          type: 'string',
          description: 'Optional aisle or category, e.g. Dairy or Produce.',
        },
      },
      required: ['item'],
    },
  },
  {
    name: 'get_shopping_list',
    description: 'Read the open (unchecked) household shopping list. Speak it briefly.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_calendar',
    description:
      'Read household calendar titles for today or this week. Uses events plus home and vehicle tasks. Does not include bills or amounts.',
    parameters: {
      type: 'object',
      properties: {
        range: {
          type: 'string',
          enum: ['today', 'this_week'],
          description: 'today or this_week (Sunday through Saturday, America/Chicago).',
        },
      },
      required: ['range'],
    },
  },
  {
    name: 'add_calendar_note',
    description:
      'Create a calendar event the phone app will show. Date must be YYYY-MM-DD in America/Chicago, or today/tomorrow.',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Short event title, e.g. Take out recycling.',
        },
        date: {
          type: 'string',
          description: 'YYYY-MM-DD, today, or tomorrow.',
        },
      },
      required: ['text', 'date'],
    },
  },
] as const;

export const HOUSEHOLD_TOOL_NAMES = HOUSEHOLD_FUNCTION_DECLARATIONS.map((tool) => tool.name);

export function isHouseholdToolName(name: string): boolean {
  return (HOUSEHOLD_TOOL_NAMES as readonly string[]).includes(name);
}

function firestoreToolError(error: unknown): ToolResult {
  const code =
    error && typeof error === 'object' && 'code' in error ? String((error as { code: unknown }).code) : '';
  const message = error instanceof Error ? error.message : String(error);
  if (/permission-denied/i.test(code) || /permission-denied/i.test(message)) {
    return { ok: false, error: 'permission-denied', spoken: RULES_DENIED_REPLY };
  }
  return { ok: false, error: 'network', spoken: HOUSEHOLD_NETWORK_REPLY };
}

function argString(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  return value == null ? '' : String(value);
}

export async function executeHouseholdTool(
  name: string,
  args: Record<string, unknown>,
  options?: { store?: HouseholdStore; actor?: Actor },
): Promise<ToolResult> {
  let actor = options?.actor;
  if (!actor) {
    const { authSpokenError, ensureTabletAuth, getCachedActor } = await import('./auth');
    actor = getCachedActor() ?? undefined;
    if (!actor) {
      const auth = await ensureTabletAuth();
      if (auth.state !== 'signed_in') {
        return { ok: false, error: auth.state, spoken: authSpokenError(auth) };
      }
      actor = auth.actor;
    }
  }

  const db = options?.store ?? (await import('./store')).getLiveStore();
  try {
    if (name === 'add_shopping_item') {
      return await addShoppingItem(db, actor, argString(args, 'item'), argString(args, 'aisle'));
    }
    if (name === 'get_shopping_list') {
      return await getShoppingList(db);
    }
    if (name === 'get_calendar') {
      return await getCalendar(db, argString(args, 'range'));
    }
    if (name === 'add_calendar_note') {
      return await addCalendarNote(db, actor, argString(args, 'text'), argString(args, 'date'));
    }
    return { ok: false, error: 'unknown_tool', spoken: 'I cannot do that from the kitchen.' };
  } catch (error) {
    return firestoreToolError(error);
  }
}
