# Phases

Frank’s kitchen-tablet build order. Phases 1–7 are on main (overnight dim). This follow-up is **portrait** layout for the **Samsung Tab A** fridge (tall, large type).

## 1. Tablet shell — done

Expo Android kiosk for the Samsung Tab A: **portrait**, keep-awake, immersive-ish system UI, sideload APK. No voice, no cloud, no dashboard.

## 2. Idle dashboard loop — done

Cycling charcoal cards (~10 seconds each) for fridge viewing:

- Weather for **Southaven, Mississippi** (Open-Meteo, no key)
- Fox News headlines with photos (public RSS)
- This day in history (Wikipedia On This Day REST API)
- Bible verse of the day (OurManna, with bible-api.com + local fallback)

## 3. Branding + hatch — done

House-in-the-nest stills in the same carousel, plus a rare silent hatch showpiece.

- Frequent cards: official PWA house-in-the-nest icon and a short rotating line (“Nestor here”, “Nestor ready for business”, …)
- Every `BRANDING_SHOWPIECE_EVERY` branding pass (default **10**): official splash (cracked egg + cottage) → shell fragments float out with a slow zoom → large serif **Nestor** → **Hi, I'm Nestor, your personal assistant**
- Visual only. No TTS, no music

## 4. Wake / sleep — done

Always-listening on-device keyword spotting. Picovoice / Porcupine is **abandoned**. Phase 4 uses **sherpa-onnx** KWS (no AccessKey, no `.ppn`, no network wake service).

- Wake phrase **Nestor** (configurable; fallback **Hey Nestor** if the single word is jumpy)
- Sleep phrase **Goodbye Nestor**, or ~5 minutes of silence
- On wake: dashboard pauses, cream/sage egg listening face (calm idle / blink)
- On sleep: unhurried chicken-legs exit, then the idle loop resumes
- `RECORD_AUDIO` + a calm “mic needed” card if permission is denied (kiosk does not brick)

## 5. Listen → answer — done

After wake, one spoken request at a time, then a spoken + on-screen reply. Follow-ups stay in the same session (no wake word again) until **Goodbye Nestor** or ~5 minutes of silence.

- Speech in: Android `SpeechRecognizer` (on-device when the tablet has it, otherwise the free OS recognizer). Prefers offline.
- Ignores short ambient chatter; acts on things that read like a request
- Kitchen brain: Gemini API with Google Search grounding for current facts. Key is `EXPO_PUBLIC_GEMINI_API_KEY` or `GEMINI_API_KEY` (`.env` or EAS secret) — never hardcoded, never committed, never named on screen
- Speech out: Android TTS plus large on-screen text. Mute / quieter / louder on the egg screen
- Talking egg: mouth motion while TTS plays (Phase 4 listen/blink/exit still there)
- On-screen identity stays **Nestor**. Do not name the model

## 6. Household data — done

Firestore tools on the existing **nestor-c2ae8** project (same as the Nestor PWA). Email/Password kiosk sign-in with `NESTOR_TABLET_EMAIL` + `NESTOR_TABLET_PASSWORD`; session persists on the tablet.

- `add_shopping_item` / `get_shopping_list` → `shopping` (exact PWA `saveShopping` fields; actor is the signed-in email)
- `get_calendar` → `events` titles/dates for today or this week. Optional clean `maintenance` / `vehicleTasks` `nextDue` reminders. Skip bills/payments entirely
- `add_calendar_note` → `events` with exact PWA `saveEvent` fields (`billId` "")
- Voice refuses private notes, passwords, the safe, emergency info, and bill secrets
- Mute / volume unchanged. If shopping hits permission-denied, publish `firestore.rules` from shootngo/Nestor as owner

Details: [docs/HOUSEHOLD.md](./docs/HOUSEHOLD.md).

## 7. Overnight presence — **this repo, now**

Dim the fridge screen overnight (~10pm–6am America/Chicago) without going fully black.

- Soft veil over the still-cycling dashboard and branding, plus a large faint clock
- Full brightness at 6am (and whenever a wake session is up)
- **Nestor** still wakes to his name at night — answers are quieter — then the veil returns after **Goodbye Nestor** or the silence timeout
- Hours: `OVERNIGHT_DIM_START_HOUR` / `OVERNIGHT_DIM_END_HOUR` in `src/config.ts`
- **Samsung Tab A** fridge UI is **portrait** (tall) with large type. Overnight veil + faint clock unchanged. Fire landscape notes are outdated. See [docs/OVERNIGHT.md](./docs/OVERNIGHT.md)
