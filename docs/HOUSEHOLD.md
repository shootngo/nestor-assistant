# Household data (Phase 6)

Kitchen voice can add to the shopping list, read open items, hear a brief calendar, and add a calendar note. It uses the existing Firebase project **nestor-c2ae8** (same as [shootngo/Nestor](https://github.com/shootngo/Nestor)). Do not create a new project.

On screen and in speech the assistant is **Nestor**. Do not name the model.

## One-time tablet sign-in

Firestore rules only allow the two household Email/Password accounts:

- `shootngo@gmail.com`
- `jeannie.newall@gmail.com`

Frank creates or uses **shootngo@gmail.com** (or another household email that has been added to `firestore.rules`) in Firebase Authentication → Email/Password. Then set the tablet secrets. The kiosk signs in silently at launch and **persists the session** on the tablet (AsyncStorage) so he is not typing daily.

Never commit the password. It is baked into the APK at bundle time, same as the Gemini key — treat the APK as household-only.

### Local `.env`

```sh
cp .env.example .env
```

```
NESTOR_TABLET_EMAIL=shootngo@gmail.com
NESTOR_TABLET_PASSWORD=your-password-here
```

`EXPO_PUBLIC_NESTOR_TABLET_EMAIL` / `EXPO_PUBLIC_NESTOR_TABLET_PASSWORD` also work if Metro needs the public slot. Rebuild after changing these.

### EAS secrets

```sh
npx eas-cli secret:create --name NESTOR_TABLET_EMAIL --value "shootngo@gmail.com" --scope project
npx eas-cli secret:create --name NESTOR_TABLET_PASSWORD --value "your-password-here" --scope project
```

Keep `GEMINI_API_KEY` (or `EXPO_PUBLIC_GEMINI_API_KEY`) as well.

### Firebase web config

Public web keys are already embedded (from shootngo/Nestor `js/config.js`). Override only if needed:

`NESTOR_FIREBASE_API_KEY`, `NESTOR_FIREBASE_AUTH_DOMAIN`, `NESTOR_FIREBASE_PROJECT_ID`, `NESTOR_FIREBASE_STORAGE_BUCKET`, `NESTOR_FIREBASE_MESSAGING_SENDER_ID`, `NESTOR_FIREBASE_APP_ID`

(or the `EXPO_PUBLIC_` variants). Default project is **nestor-c2ae8**.

## Voice tools

| Tool | Firestore | Spoken |
| --- | --- | --- |
| `add_shopping_item(item, aisle?)` | `shopping` | “Added milk to the list” |
| `get_shopping_list()` | `shopping` (unchecked only) | Brief list |
| `get_calendar(range)` | `events` (main). Optional clean `maintenance` / `vehicleTasks` `nextDue` reminders | Today or this week (Sun–Sat, America/Chicago) |
| `add_calendar_note(text, date)` | `events` (title/date; empty notes, no bill link) | Confirms the title and date |

Shopping writes match the PWA (`js/store.js` `saveShopping`):

`{ id, text, aisle, notes, checked, createdBy, createdAt, updatedBy, updatedAt }`

Calendar notes match `saveEvent`:

`{ id, title, date (YYYY-MM-DD), notes, billId (optional ""), createdBy, createdAt, updatedBy, updatedAt }`

`createdBy` / `updatedBy` are the PWA `actor()` object (`uid`, `email`, `displayName`). The actor identity is the **signed-in household email**.

### Calendar scope

Main path: **event** titles and dates for today / this week. Optional **reminders** from `maintenance` and `vehicleTasks` `nextDue` only when the title is clean (no bills, amounts, secrets). Voice never reads `bills` or `payments`, never speaks amounts, and never reads `lastCompleted` or event notes.

Voice must never read or write: private notes, passwords, the safe, emergency information, or bill payment secrets. Nestor refuses those politely and points Frank to the phone app.

## If shopping fails with permission-denied

`firestore.rules` in shootngo/Nestor already includes `shopping`, but the rules have to be **published** as a Firebase owner (Console → Firestore → Rules, or the Nestor PWA deploy path). If voice shopping fails with permission-denied, publish those rules from [shootngo/Nestor](https://github.com/shootngo/Nestor) `firestore.rules` (or the Console) while signed in as the project owner. The tablet cannot publish rules.

Allowed emails in rules must stay in sync with this household list.

## Mute / volume

Unchanged from Phase 5. **Mute** / **–** / **+** on the egg screen.

## Out of scope

Overnight dim (Phase 7), Picovoice, a new Firebase project, expanding voice to private data or bill amounts.
