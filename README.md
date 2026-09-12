# Nestor Assistant

Kitchen kiosk for Frank Mulkey’s Nestor household app on a **small Samsung Tab (~5 years old / ~2021)**. Landscape, always-on, plugged in on the fridge. Type is large enough to read from the kitchen. The on-screen and spoken identity is **Nestor**. Do not name or show the underlying AI model.

This repo is an Expo (React Native) Android app. It is **not** an Expo Go project — native modules (keyword spotting, microphone, speech in/out) require `expo-dev-client` and prebuild.

## Fridge setup checklist

One pass before the small Samsung Tab lives on the fridge:

1. **Prebuild / APK** — `npm install`, then `npx expo prebuild --platform android`. Install a **preview** APK (EAS or Gradle) on the small ~2021 Samsung Tab. `minSdkVersion` stays **24**. Do not use Expo Go.
2. **Gemini key** — set `GEMINI_API_KEY` or `EXPO_PUBLIC_GEMINI_API_KEY` in `.env` or as an EAS secret. Rebuild after setting or rotating it.
3. **Tablet email / password** — set `NESTOR_TABLET_EMAIL` + `NESTOR_TABLET_PASSWORD` (household Email/Password, usually `shootngo@gmail.com`). Rebuild. Session persists on the tablet.
4. **Shopping rules** — if “add milk to the list” comes back permission-denied, publish `firestore.rules` from [shootngo/Nestor](https://github.com/shootngo/Nestor) as the Firebase owner. The tablet cannot publish rules.
5. **Overnight hours** — default **10pm–6am** America/Chicago (`OVERNIGHT_DIM_START_HOUR = 22`, `OVERNIGHT_DIM_END_HOUR = 6` in `src/config.ts`). Faint clock at night; full brightness at 6am. Rebuild JS/APK after changing hours.

Details: [docs/HOUSEHOLD.md](./docs/HOUSEHOLD.md), [docs/OVERNIGHT.md](./docs/OVERNIGHT.md).

## Phase 7 (this PR)

Overnight the board stays on but goes quiet. From about **10pm to 6am** America/Chicago a soft veil covers the cycling cards and a large faint clock stays readable across the kitchen. At 6am it fades back to full brightness.

**Nestor** still wakes to his name at night. The veil lifts for the egg, answers are quieter, **Mute** / **–** / **+** still work, and after **Goodbye Nestor** (or five quiet minutes) the screen dims again.

Phases 1–6 stay in force: dashboard, hatch, on-device wake/sleep, listen → answer, shopping and calendar tools. Picovoice stays out.

Secrets, rules publish, and calendar scope: [docs/HOUSEHOLD.md](./docs/HOUSEHOLD.md). Night veil + faint clock (brightness APIs off on this Tab): [docs/OVERNIGHT.md](./docs/OVERNIGHT.md).

### Speech in / speech out

| Piece | What we use |
| --- | --- |
| Speech in | Local Expo module `modules/nestor-voice` wrapping Android `SpeechRecognizer`. Prefers on-device / `EXTRA_PREFER_OFFLINE`, then the free OS recognizer. No paid STT. |
| Speech out | Same module, Android `TextToSpeech`, plus large on-screen text |
| Mute / volume | **Mute** toggle and **–** / **+** on the egg screen (TTS volume and the tablet media stream) |
| Talking egg | Mouth animation while TTS plays. Phase 4 blink / rest / chicken-legs exit unchanged |

The Phase 4 `AudioRecord` mic is released while SpeechRecognizer owns the microphone, then restored for wake spotting after the egg walks off. If this tablet has no recognizer, Nestor says so (without naming vendors) and keeps the Phase 4 mic so **Goodbye Nestor** still works.

### Kitchen brain

Answers go through the Gemini API with **Google Search grounding** so current facts (news, today’s weather elsewhere, a recipe detail) are not frozen training data. The on-screen name is still **Nestor**. Never show a model name.

The key is **not** in source and must never be committed. Builds read **either** `EXPO_PUBLIC_GEMINI_API_KEY` or `GEMINI_API_KEY` (Frank’s Grok box / EAS secret / `.env`). `app.config.js` copies the plain name into Expo’s public slot and `extra` so Metro and the APK both see it. Rebuild after setting or rotating it.

Tablet household sign-in uses `NESTOR_TABLET_EMAIL` + `NESTOR_TABLET_PASSWORD` (or `EXPO_PUBLIC_` variants). Never commit the password. See [docs/HOUSEHOLD.md](./docs/HOUSEHOLD.md).

#### Local `.env`

```sh
cp .env.example .env
```

Put the key in `.env` under **one** of these names (both are gitignored):

```
GEMINI_API_KEY=your-key-here
```

or:

```
EXPO_PUBLIC_GEMINI_API_KEY=your-key-here
```

Also set the tablet household login (must match `firestore.rules`):

```
NESTOR_TABLET_EMAIL=shootngo@gmail.com
NESTOR_TABLET_PASSWORD=your-password-here
```

Get a key from [Google AI Studio](https://aistudio.google.com/apikey). Do not commit `.env`. Do not paste the key into the README, issues, or chat logs.

Then rebuild (Metro / EAS / Gradle) so the bundle picks it up.

#### EAS secret (cloud APK)

Create a project secret with **either** name. EAS injects it as an env var while bundling; `app.config.js` accepts both:

```sh
npx eas-cli secret:create --name GEMINI_API_KEY --value "your-key-here" --scope project
npx eas-cli secret:create --name NESTOR_TABLET_EMAIL --value "shootngo@gmail.com" --scope project
npx eas-cli secret:create --name NESTOR_TABLET_PASSWORD --value "your-password-here" --scope project
# or
npx eas-cli secret:create --name EXPO_PUBLIC_GEMINI_API_KEY --value "your-key-here" --scope project
```

Newer Expo accounts can use EAS Environment variables instead; the name can be `GEMINI_API_KEY` or `EXPO_PUBLIC_GEMINI_API_KEY`. After the secret exists:

```sh
npx eas-cli build -p android --profile preview
```

If the key is missing, Nestor still wakes and listens. He will say he needs the kitchen key set — he will not name the vendor on screen.

### Config knobs (`src/config.ts`)

Wake / sleep (Phase 4, still in force):

| Knob | Default | Meaning |
| --- | --- | --- |
| `WAKE_PHRASE` | `nestor` | `nestor` or `hey_nestor` |
| `KWS_KEYWORDS_THRESHOLD` | `0.32` | Global sherpa-onnx threshold. **Higher = less sensitive.** |
| `LISTENING_SILENCE_MS` | `300000` | ~5 minutes of quiet → exit (resets on speech in, thinking, or talking) |
| `LISTENING_VOICE_RMS` | `0.018` | Mic energy that resets the silence timer when the KWS mic is running |
| `EGG_EXIT_MS` | `2800` | Unhurried walk-off |
| `ALLOW_WAKE_SIMULATE` | `true` | Tap or long-press the wordmark / egg to preview without speaking |

Overnight (Phase 7):

| Knob | Default | Meaning |
| --- | --- | --- |
| `OVERNIGHT_DIM_START_HOUR` | `22` | Local hour the veil begins (America/Chicago) |
| `OVERNIGHT_DIM_END_HOUR` | `6` | Local hour the veil lifts for the day |
| `OVERNIGHT_DIM_MS` | `1600` | Soft fade in/out, including night wake |
| `OVERNIGHT_USE_WINDOW_BRIGHTNESS` | `false` | Leave off on the ~2021 Tab. Overlay is the night look |
| `OVERNIGHT_WINDOW_BRIGHTNESS` | `0.08` | Only if the flag above is turned on |
| `OVERNIGHT_DAY_WINDOW_BRIGHTNESS` | `1` | Only if the flag above is turned on |
| `OVERNIGHT_TTS_SCALE` / `OVERNIGHT_TTS_CAP` | `0.35` / `0.38` | Quieter night answers. Mute still wins |

Dashboard (unchanged from Phase 3):

| Knob | Default | Meaning |
| --- | --- | --- |
| `CARD_INTERVAL_MS` | `10000` | Dwell for weather, news, history, verse, and simple branding |
| `CARD_FADE_MS` | `520` | Fade between cards |
| `BRANDING_SHOWPIECE_EVERY` | `10` | Hatch replaces a branding still on every Nth branding pass |
| `BRANDING_SHOWPIECE_MS` | `10000` | Showpiece dwell |
| `PLAYLIST_REFRESH_MS` | 15 minutes | Reload remote feeds |

### Keywords

Sherpa-onnx does not take raw English. Each line is BPE pieces from `assets/kws/bpe.model`, then optional `:score`, `#threshold`, and `@id`.

Default (`assets/kws/keywords.nestor.txt`):

```
▁NE S T OR :1.0 #0.42 @nestor
▁GOOD B Y E ▁NE S T OR :1.5 #0.22 @goodbye_nestor
```

Fallback (`assets/kws/keywords.hey_nestor.txt`) when `WAKE_PHRASE = 'hey_nestor'`:

```
▁HE Y ▁NE S T OR :1.2 #0.28 @hey_nestor
▁GOOD B Y E ▁NE S T OR :1.5 #0.22 @goodbye_nestor
```

The active file is written to disk at first run from `src/wake/keywords.ts`, so changing `WAKE_PHRASE` or the `#threshold` numbers and rebuilding JS/APK is enough.

More detail: [assets/kws/README.md](./assets/kws/README.md).

Web preview only (ignored on the APK):

- `?session=listen` — egg listening face, mute controls visible
- `?session=talk` — talking egg + sample on-screen answer
- `?session=talk&demo=add` — talking egg + “Added milk to the list.”
- `?session=talk&demo=list` — talking egg + open-list sample
- `?session=talk&demo=calendar` — talking egg + calendar sample
- `?session=talk&hold=1` — freeze the mouth open for a still
- `?session=mute` — same answer with **Muted**
- `?session=exit` — chicken-legs walk-off, then the dashboard
- `?session=exit&hold=1` — freeze mid-walk
- `?session=mic` — calm “mic needed” card
- `?wakeTap=1` — tap the dashboard to wake
- `?night=1` — overnight veil + faint clock
- `?night=1&clock=10:42&period=PM` — freeze the night clock
- `?night=0` — force daytime
- `?session=listen&night=1` — night wake (veil lifts)
- Phase 3 stills: `?start=branding`, `?start=showpiece`, `?showpieceFrame=nest\|egg\|hatch\|house`

## Not in Phase 7

Picovoice, naming the model on the UI, traffic, fuel, sunrise/sunset, moon, Dollar Tree, voice access to private notes / passwords / bills.

Phases 1–7 are listed as done in [PHASES.md](./PHASES.md).

## Screenshots

Landscape web preview (fridge install path is still the Android APK):

- Phase 7 overnight: [daytime dashboard](./docs/phase-7-day.png), [overnight dim + clock](./docs/phase-7-night.png), [night wake](./docs/phase-7-wake.png), [dim after wake](./docs/phase-7-dim-after-wake.png)
- [Egg listening](./docs/phase-5-listening.png)
- [Talking egg + answer](./docs/phase-5-talking.png)
- [Muted](./docs/phase-5-mute.png)
- Phase 6 household stills: [added to list](./docs/phase-6-added.png), [shopping list](./docs/phase-6-list.png), [calendar](./docs/phase-6-calendar.png)

Phase 4 wake/sleep: [idle dashboard](./docs/phase-4-dashboard.png), [listening](./docs/phase-4-listening.png), [exit](./docs/phase-4-exit.png), [mic needed](./docs/phase-4-mic.png).

Phase 3 branding stills: [house in the nest](./docs/phase-3-branding.png), [hatch nest](./docs/phase-3-hatch-nest.png), [hatch open](./docs/phase-3-hatch-open.png), [hatch house](./docs/phase-3-hatch-house.png).

Phase 2 cards: [weather](./docs/phase-2-weather.png), [Fox News](./docs/phase-2-news.png), [history](./docs/phase-2-history.png), [verse](./docs/phase-2-verse.png).

## Requirements

- Node.js 22.13+ (SDK 57)
- npm
- For **EAS cloud builds**: an Expo account (`npx eas-cli login`)
- For **local APKs**: Android Studio / Android SDK + JDK 17 or 21
- NDK is pulled in by `expo-sherpa-onnx` on Android prebuild
- A Gemini API key for answers (`GEMINI_API_KEY` or `EXPO_PUBLIC_GEMINI_API_KEY`)
- Household Email/Password for Firestore (`NESTOR_TABLET_EMAIL` + `NESTOR_TABLET_PASSWORD`)
- Fridge device: small Samsung Tab (~2021). APK `minSdkVersion` is **24** so that era still installs — do not raise it to 33+

## Setup

```sh
git clone https://github.com/shootngo/nestor-assistant.git
cd nestor-assistant
npm install
cp .env.example .env   # Gemini key + NESTOR_TABLET_EMAIL / NESTOR_TABLET_PASSWORD
```

Native `android/` is generated, not committed:

```sh
npx expo prebuild --platform android
```

`--clean` regenerates from `app.json` if native folders already exist (`npx expo prebuild --platform android --clean`).

Optional checks:

```sh
npm run check-feeds
npm run check-listen
npm run check-household
npm run check-overnight
npm run typecheck
```

## Development build (USB tablet + Metro)

Use this when iterating on JS. The tablet must reach the machine running Metro (same Wi-Fi, or USB).

```sh
npx expo run:android --device
# or after a one-time native build:
npx expo start --dev-client
```

`expo-dev-client` is required. Do not use Expo Go — sherpa-onnx, `nestor-mic`, and `nestor-voice` will not be there.

Web preview (`npx expo start --web`) is only for a quick look at the dashboard and egg UI. Keep-awake, immersive bars, keyword spotting, SpeechRecognizer, and TTS apply on Android.

## APK for the Samsung Tab (no Metro)

Install a **preview APK** so the tablet does not need a computer. Rebuild after pulling Phase 7 — speech in/out is native, and the Gemini key plus tablet password are baked in at bundle time.

### Option A — EAS Build (recommended)

One-time:

```sh
npx eas-cli login
npx eas-cli init    # creates the Expo project; accept the slug nestor-assistant
npx eas-cli secret:create --name GEMINI_API_KEY --value "your-key-here" --scope project
npx eas-cli secret:create --name NESTOR_TABLET_EMAIL --value "shootngo@gmail.com" --scope project
npx eas-cli secret:create --name NESTOR_TABLET_PASSWORD --value "your-password-here" --scope project
```

Cloud (no local Android SDK):

```sh
npx eas-cli build -p android --profile preview
```

Local Gradle via EAS (needs Android SDK):

```sh
npx eas-cli build -p android --profile preview --local
```

When the build finishes, download the `.apk`.

Profiles in `eas.json`:

| Profile | What you get |
| --- | --- |
| `preview` | Standalone APK for the fridge (use this for Phase 7 sign-off) |
| `development` | Debug APK with the dev-client launcher (needs Metro) |
| `production` | Standalone APK (same install path as preview for this household app) |

### Option B — Gradle on your machine

```sh
npx expo prebuild --platform android
npx expo run:android --variant release --device
```

Or assemble an APK without installing:

```sh
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

Release APK path:

`android/app/build/outputs/apk/release/app-release.apk`

Debug APK (easier if you have not set up a release keystore):

```sh
cd android
./gradlew assembleDebug
```

`android/app/build/outputs/apk/debug/app-debug.apk`

Expo’s prebuild debug keystore is enough to sideload a debug APK. `assembleRelease` needs a signing key; EAS preview handles that for you.

If you use a local `.env`, Gradle/Metro must see `GEMINI_API_KEY` or `EXPO_PUBLIC_GEMINI_API_KEY` and the tablet email/password at bundle time. EAS preview should use EAS secrets. Never commit `.env`.

## Install on the small Samsung Tab (primary)

~2021 Galaxy Tab, Play Store Android. The fridge mount is **landscape** and **always-on** (plugged in). Type is large for that smaller screen. The app already locks landscape and holds keep-awake. `minSdkVersion` 24 — the APK must still install on this tablet.

### Enable unknown sources

1. Copy the APK to the Tab (USB, Drive, email, or `adb` below).
2. Open **Settings → Apps** (or the prompt Android shows) → **Special access** / **Install unknown apps**.
3. Allow **Files**, **Chrome**, or whichever app you use to open the APK.
4. Open the APK and install **Nestor**.

If Android blocks the install, tap **Settings** on the prompt and allow that source, then retry.

### USB debugging (`adb install`)

1. **Settings → About tablet** (tap the build number seven times if developer options are hidden).
2. Enable **USB debugging** / **ADB**.
3. Plug in the Tab, accept the RSA prompt.
4. From a machine with platform-tools:

```sh
adb devices
adb install -r path/to/app-release.apk
```

Replace an older build with `-r`. The launcher name is **Nestor**.

### After install

1. Open **Nestor**.
2. Allow the microphone when Android asks. If you deny it, a cream card explains why; **Continue to the kitchen board** keeps the dashboard running.
3. Mount the Tab in landscape. The app locks that orientation.
4. Confirm the charcoal dashboard still cycles. Say **Nestor**. The egg should appear.
5. Ask a general question (“How long should I rest a roast?”). Nestor should speak the answer and show it in large type. The mouth should move unless **Mute** is on.
6. Ask **Add milk to the list.** He should confirm out loud. Then **What's on the shopping list?** and **What's on the calendar today?**
7. Ask a follow-up without saying **Nestor** again. Then say **Goodbye Nestor** (or wait five quiet minutes). The egg should walk off.
8. Use **Mute** / **–** / **+** on the egg screen if the kitchen is too loud or too quiet.
9. After ~10pm Chicago time a dim veil and a large faint clock should show. Say **Nestor** — the egg should appear (quieter voice). **Goodbye Nestor** should dim the board again. At 6am the veil should lift. Do not expect the system backlight API to work on this older Tab.
10. Keep the Tab plugged in. Leave battery saver / sleep optimizations off for **Nestor**. Overnight dim is not a power-off. Do not grant “Modify system settings”.

Speech-to-text uses the Google / Play Store recognizer on the Tab. It is free OS STT, not a paid cloud SKU.

## Fire tablet (secondary)

The same APK still sideloads if the old Fire is around. Treat it as plain Android: **Settings → Security & privacy** → **Apps from Unknown Sources** / **Install unknown apps**, then open the APK. USB debugging is under **Settings → Device options** (tap the serial number seven times if that menu is hidden).

The on-screen veil + faint clock are the night look (same as the Samsung Tab). Speech-to-text is whatever recognizer that Fire already has (Play Store / Google speech, or Amazon’s).

## Identity

On screen and in spoken copy, the assistant is **Nestor**. Never show a model name in the UI.

## Test notes

See [docs/TEST_NOTES.md](./docs/TEST_NOTES.md).
