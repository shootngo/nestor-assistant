# Test notes

## Phase 7 — overnight dim + faint clock

Confirm on the **Samsung Tab A** (portrait) after installing a rebuilt APK. Web preview can show the veil and clock but cannot change real tablet brightness or run STT/TTS.

Hours, Samsung window brightness, and Fire fallback: [OVERNIGHT.md](./OVERNIGHT.md).

### Engine

| Piece | What we use |
| --- | --- |
| Window | America/Chicago hours in `src/config.ts` (`22` → `6`) |
| Look | Soft full-screen veil + large faint clock. Cards and branding still cycle underneath |
| Brightness | Samsung / Android `expo-brightness` `setBrightnessAsync` (window only, no `WRITE_SETTINGS`). Veil + clock always. Fire OS may ignore the backlight |
| Night wake | Keyword spotting stays up. Veil lifts for the egg; TTS is quieter; mute / volume unchanged |
| After session | **Goodbye Nestor** or ~5 minutes quiet → exit → veil returns if still in the window |
| Abandoned | Picovoice; naming the model; new voice tools; traffic / fuel / moon |

### App checks

| Check | Expected |
| --- | --- |
| Identity | **Nestor** only. No model name |
| Day | Full-brightness dashboard before 10pm / after 6am Chicago |
| Night idle | ~10pm–6am: dim veil, large faint clock, cards still cycle |
| Night wake | Say **Nestor** → cream egg, mute controls visible, quieter voice |
| Mute | **Mute** still silences TTS; text still shows |
| Sleep | **Goodbye Nestor** → walk-off → veil and clock return (if still overnight) |
| Morning | 6am fades to full brightness |
| Keep-awake | Screen stays on; portrait; immersive bars |

### Scripted checks (this environment)

```sh
npm run check-overnight
npm run check-listen
npm run check-household
npx tsc --noEmit
```

Portrait web preview stills (~800×1280):

- [Daytime dashboard](./phase-7-day.png)
- [Overnight dim + clock](./phase-7-night.png)
- [Night wake](./phase-7-wake.png)
- [Dim after wake](./phase-7-dim-after-wake.png)

```
?night=0
?night=1&clock=10:42&period=PM
?session=listen&night=1
?night=1&wakeTap=1
```

### Expected Samsung Tab night check (not runnable in CI)

1. Sideload a Phase 7 APK on the Samsung Tab. Landscape, plugged in, **Nestor** in the foreground.
2. After 10pm Chicago (or temporarily set `OVERNIGHT_DIM_START_HOUR` to the current hour and rebuild), confirm the backlight dims, the veil, and the clock.
3. Say **Nestor**. Egg should appear at full brightness. Ask something short. Voice should be quieter than daytime. **Mute** should still work.
4. Say **Goodbye Nestor**. Board should dim again.
5. In the morning the veil should be gone and the backlight full.

Fire tablet (secondary): same APK. If the backlight stays bright, the veil + clock are still the night look.

## Phase 6 — household shopping + calendar

Confirm on the Samsung Tab after installing a rebuilt APK with the Gemini key **and** `NESTOR_TABLET_EMAIL` / `NESTOR_TABLET_PASSWORD` baked in. The tablet must use a household Email/Password account (`shootngo@gmail.com` or `jeannie.newall@gmail.com`). Web preview can show canned confirmations but cannot sign in to Firestore or run STT/TTS.

One-time secrets and rules publish: [HOUSEHOLD.md](./HOUSEHOLD.md).

### Engine

| Piece | What we use |
| --- | --- |
| Wake / sleep / STT / TTS / mute | Unchanged from Phase 5 |
| Brain | Gemini `generateContent` with household **function tools** plus Google Search grounding (search is dropped automatically if the API rejects the combination) |
| Auth | Firebase Email/Password, session persisted with AsyncStorage |
| Shopping | `shopping` collection — same write shape as shootngo/Nestor `saveShopping` |
| Calendar read | `events` titles/dates. Optional clean `maintenance` / `vehicleTasks` `nextDue` reminders. **Not** `bills` / `payments` / amounts / lastCompleted |
| Calendar write | `events` (`add_calendar_note`) |
| Abandoned | Picovoice; naming the model; voice access to private notes / passwords / safe / emergency / bills |

### App checks

| Check | Expected |
| --- | --- |
| Identity | **Nestor** only. No model name |
| Add item | “Add milk to the list” → “Added milk to the list.” (aisle optional) |
| Read list | “What's on the shopping list?” → open (unchecked) items, spoken briefly |
| Calendar | “What's on the calendar today?” / “this week” → event titles and dates; optional clean reminders; no amounts |
| Calendar note | “Add a note on the calendar: take out recycling tomorrow” → event the PWA will show |
| Privacy | Passwords, private notes, safe, emergency, bill amounts → polite refusal, phone app |
| Mute | Unchanged |
| Missing tablet password | General questions still work. Household tools say the tablet needs to be signed in |
| permission-denied | Spoken line about publishing Firestore rules. Publish from shootngo/Nestor as owner |
| Overnight dim | Phase 7 — still required |

### Scripted tool checks (this environment)

No Samsung Tab and no household password in CI. Memory-store tool checks cover add-item, read-list, calendar today/week, calendar note, and permission-denied mapping:

```sh
npm run check-household
npm run check-listen
npx tsc --noEmit
```

Sample spoken lines from that run are recorded in the PR. Landscape web preview stills (1280×800):

- [Added milk to the list](./phase-6-added.png)
- [Open shopping list](./phase-6-list.png)
- [Calendar today](./phase-6-calendar.png)

```
?session=talk&demo=add
?session=talk&demo=list
?session=talk&demo=calendar
```

### Expected Samsung Tab conversation (not runnable in CI)

1. Sideload a Phase 6 APK with Gemini key + tablet email/password.
2. Open **Nestor**, allow the microphone, say **Nestor**.
3. **Add milk to the list.** Confirm the spoken line. Check the phone PWA shopping list.
4. **What's on the shopping list?** Brief open items.
5. **What's on the calendar today?** Titles only, no bill amounts.
6. **Add a note to the calendar for tomorrow: call the plumber.** Confirm it appears in the PWA.
7. **What's the wifi password?** / **How much is the power bill?** Polite refusal.
8. Mute still works. **Goodbye Nestor** still walks off.

### Secrets

```
cp .env.example .env
# GEMINI_API_KEY=...
# NESTOR_TABLET_EMAIL=shootngo@gmail.com
# NESTOR_TABLET_PASSWORD=...
```

Never commit `.env`. Rebuild after changing secrets.

## Phase 5 — listen → answer

Still required under Phase 6. Confirm on the Samsung Tab after installing a rebuilt APK with `GEMINI_API_KEY` or `EXPO_PUBLIC_GEMINI_API_KEY` baked in. Web preview can show the egg UI, mute control, and talking mouth but **cannot** run SpeechRecognizer, TTS, or the kitchen brain.

### Engine

| Piece | What we use |
| --- | --- |
| Wake / sleep | Unchanged from Phase 4: `expo-sherpa-onnx` + `modules/nestor-mic` |
| Speech in | `modules/nestor-voice` → Android `SpeechRecognizer` (prefer on-device / offline, then OS recognizer) |
| Brain | Gemini API `generateContent` + `tools: [{ google_search: {} }]`. Key: `GEMINI_API_KEY` or `EXPO_PUBLIC_GEMINI_API_KEY` |
| Speech out | Android `TextToSpeech` in `nestor-voice`, plus large on-screen text |
| Mute / volume | On-screen **Mute** / **–** / **+** |
| Abandoned | Picovoice / Porcupine; naming the model on UI |

### App checks

| Check | Expected |
| --- | --- |
| Launcher name | **Nestor** |
| Identity | No model name anywhere. Egg never says Gemini / Google / sherpa / Picovoice |
| Idle | Phase 3 dashboard still cycles |
| Wake | Say **Nestor** → egg, **Listening…**, mute controls visible |
| Request | “How long should I rest a roast?” → thinking → spoken answer + large text + talking mouth |
| Chatter | “yeah” / “hmm” → stay listening, no answer |
| Follow-up | Next question without the wake word still answers |
| Sleep | **Goodbye Nestor** (spoken) or ~5 minutes quiet → chicken-legs exit → dashboard |
| Mute | **Mute** stops TTS; answer still on screen; mouth rests. **+** unmutes |
| Missing key | Wakes and listens; spoken/on-screen line about the kitchen key — no vendor name |
| Keep-awake | Screen stays on; landscape; immersive bars |
| Out of scope | Shopping/calendar are Phase 6. Overnight dim is Phase 7 |

### Expected Samsung Tab conversation test (not runnable in CI)

This environment has no tablet microphone. On the fridge Tab, after sideloading the Phase 5 APK:

1. Open **Nestor**, allow the microphone.
2. Say **Nestor**. Egg appears. Ask **How long should I rest a roast?** He should talk and show the answer. Mouth moves.
3. Ask a follow-up (**What about chicken?**) without saying Nestor again.
4. Tap **Mute** and ask again. Text still appears; no voice.
5. Say **Goodbye Nestor**. Egg walks off.
6. If STT never hears you but wake still works, the tablet’s recognizer may be missing. Nestor should say speech-to-text isn’t on this tablet and **Goodbye Nestor** should still work via the Phase 4 spotter.

### Gemini key

```
cp .env.example .env
# GEMINI_API_KEY=...
# or EXPO_PUBLIC_GEMINI_API_KEY=...
```

EAS (either name): `npx eas-cli secret:create --name GEMINI_API_KEY --value "..." --scope project`

Rebuild the APK after setting the key. Never commit `.env`. `app.config.js` maps `GEMINI_API_KEY` onto Expo’s public slot at bundle time.

### Web preview (UI only)

```
?session=listen
?session=talk
?session=talk&hold=1
?session=mute
?session=exit
?session=exit&hold=1
?session=mic
?wakeTap=1
```

Verified in this Phase 5 change: `npx tsc --noEmit` and `npm run check-listen` are clean. Landscape web preview at 1280×800 shows listening, talking egg + answer, and mute. Identity stayed **Nestor**. Full tablet STT / TTS / grounded answers still need a sideloaded APK with a key.

### Rebuild APK

After `npm install` and setting the Gemini key:

- EAS: `npx eas-cli build -p android --profile preview`
- Local: `npx expo prebuild --platform android` then `cd android && ./gradlew assembleDebug`

Sideload with `adb install -r`. `expo-sherpa-onnx`, `nestor-mic`, and `nestor-voice` are native — Expo Go will not work.

## Phase 4 — wake / sleep

Still required. Web preview can show the egg UI but **cannot** run on-device KWS (no Android mic module).

### Engine

| Piece | What we use |
| --- | --- |
| KWS | `expo-sherpa-onnx` + bundled English zipformer (GigaSpeech int8) |
| Mic | local Expo module `modules/nestor-mic` (`AudioRecord` 16 kHz mono) |
| Wake | `Nestor` (`WAKE_PHRASE = 'nestor'`) |
| Sleep | `Goodbye Nestor`, or ~5 minutes without speech |
| Abandoned | Picovoice / Porcupine (no AccessKey, no `.ppn`) |

### Config knobs (`src/config.ts`)

| Knob | Default | Notes |
| --- | --- | --- |
| `WAKE_PHRASE` | `nestor` | Switch to `hey_nestor` if the single word false-triggers |
| `KWS_KEYWORDS_THRESHOLD` | `0.32` | Global default. Per-keyword `#` in `assets/kws/keywords.*.txt` wins |
| `KWS_KEYWORDS_SCORE` | `1.2` | Boost. Prefer raising `#threshold` to quiet false wakes |
| `LISTENING_SILENCE_MS` | `300000` | 5 minutes |
| `LISTENING_VOICE_RMS` | `0.018` | Fridge-hum filter for the silence timer |
| `EGG_EXIT_MS` | `2800` | Unhurried walk-off |
| `ALLOW_WAKE_SIMULATE` | `true` | Tap or long-press the wordmark / listening egg to preview without speaking |

Per-keyword thresholds already shipped:

| Phrase | `#threshold` | Why |
| --- | --- | --- |
| `nestor` | `0.42` | Short word — higher bar |
| `hey_nestor` | `0.28` | Two-word fallback |
| `goodbye_nestor` | `0.22` | Longer dismiss phrase |

### App checks

| Check | Expected |
| --- | --- |
| Launcher name | **Nestor** |
| Identity | No model name anywhere |
| Idle | Phase 3 dashboard still cycles (weather, Fox, history, verse, nest, rare hatch) |
| Mic prompt | First launch asks for the microphone. Deny → cream “mic needed” card |
| Wake | Say **Nestor** → dashboard pauses → cream egg |
| Sleep | Say **Goodbye Nestor** → little legs, unhurried run off screen → dashboard resumes |
| Keep-awake | Screen stays on; landscape; immersive bars |

## Phase 3 — branding + hatch

Still required inside the idle loop. Hatch is visual only.

| Knob | Default | Notes |
| --- | --- | --- |
| `CARD_INTERVAL_MS` | 10000 | Ordinary cards, including simple branding |
| `BRANDING_SHOWPIECE_EVERY` | **10** | Hatch on the 10th, 20th, … branding pass |
| `BRANDING_SHOWPIECE_MS` | 10000 | ~5s hatch motion + hold |

Web preview overrides: `?start=branding`, `?start=showpiece`, `?showpieceEvery=1`, `?showpieceFrame=nest|egg|hatch|house`.

## Phase 2 — idle dashboard

Still required: weather (Southaven), Fox News, On This Day, verse. Feeds:

```sh
npm run check-feeds
```

| Feed | URL / coords | Notes |
| --- | --- | --- |
| Fox News (working) | `https://moxie.foxnews.com/google-publisher/latest.xml` | HTTP 200, RSS 2.0 with `media:content` photos |
| Fox News (not a feed) | `https://www.foxnews.com/about/rss` | HTML index, not used |
| Weather | Open-Meteo `34.98898, -90.01259` | Southaven, Mississippi. Timezone `America/Chicago` |
| History | Wikipedia `onthisday/selected/{MM}/{DD}` | Chicago calendar date |
| Verse | OurManna VOTD | Fallback: bible-api.com Psalm 118:24, then local copy |

## Phase 1 — kiosk shell

Still required under the dashboard: charcoal fullscreen, keep-awake, landscape, immersive-ish bars. Placeholder UI from Phase 1: [docs/phase-1-placeholder.png](./phase-1-placeholder.png).
