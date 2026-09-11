export const PRIVATE_REPLY =
  'That stays in the phone app. I do not read private notes, passwords, the safe, emergency details, or bills from here.';

export const NOT_SIGNED_IN_REPLY =
  "I can't reach the household list until this tablet is signed in. That's a one-time setup, not something I can do from here.";

export const WRONG_EMAIL_REPLY =
  'This tablet is signed in with an email that is not on the household list.';

export const RULES_DENIED_REPLY =
  'The household list is blocked until the Firestore rules are published. That is a one-time Console step, not something I can do from here.';

export const HOUSEHOLD_NETWORK_REPLY = 'I could not reach the household list. Try me again in a moment.';

export const EMPTY_SHOPPING_REPLY = 'The shopping list is empty.';

export const EMPTY_CALENDAR_TODAY_REPLY = 'Nothing on the calendar for today.';

export const EMPTY_CALENDAR_WEEK_REPLY = 'Nothing on the calendar this week.';

export function addedShoppingLine(item: string, aisle = ''): string {
  const name = item.trim();
  const shelf = aisle.trim();
  if (shelf) {
    return `Added ${name} to the list (${shelf}).`;
  }
  return `Added ${name} to the list.`;
}

export function addedCalendarLine(title: string, date: string): string {
  return `Added ${title.trim()} on ${date}.`;
}
