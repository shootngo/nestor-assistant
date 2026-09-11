# Nestor Assistant

Kitchen Fire-tablet kiosk for Frank Mulkey’s Nestor household app. The on-screen and spoken identity is **Nestor**. Do not name or show the underlying AI model.

This repo is an Expo (React Native) Android app. It is **not** an Expo Go project — native modules (keyword spotting, microphone, speech in/out) require `expo-dev-client` and prebuild.

## Phase 5 (this PR)

After **Nestor** wakes the egg (Phase 4), the kitchen can ask a question. Android speech-to-text captures one utterance. If it reads like a request, Nestor answers out loud and in large type on the cream screen. The mouth moves while he talks. Then he keeps listening for follow-ups — no wake word again — until **Goodbye Nestor** or about five quiet minutes.

Chatter like “yeah” or “hmm” is ignored. Shopping lists and the calendar wait for Phase 6.

The idle dashboard from Phase 2–3 still cycles until wake. Picovoice stays out; wake/sleep is still on-device **sherpa-onnx**.

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

The key is **not** in source. Expo inlines `EXPO_PUBLIC_` values at bundle time, so you must rebuild the APK after setting or rotating it.

#### Local `.env`

```sh
cp .env.example .env
```

Put your key in `.env`:

```
EXPO_PUBLIC_GEMINI_API_KEY=your-key-here
```

Get a key from [Google AI Studio](https://aistudio.google.com/apikey). `.env` is gitignored. Do not commit it.

Then rebuild (Metro / EAS / Gradle) so the bundle picks it up.

#### EAS secret (cloud APK)

Same name, so EAS Build injects it while bundling:

```sh
npx eas-cli secret:create --name EXPO_PUBLIC_GEMINI_API_KEY --value "your-key-here" --scope project
```

Newer Expo accounts can use EAS Environment variables instead; the name must still be `EXPO_PUBLIC_GEMINI_API_KEY`. After the secret exists:

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
- `?session=talk&hold=1` — freeze the mouth open for a still
- `?session=mute` — same answer with **Muted**
- `?session=exit` — chicken-legs walk-off, then the dashboard
- `?session=exit&hold=1` — freeze mid-walk
- `?session=mic` — calm “mic needed” card
- `?wakeTap=1` — tap the dashboard to wake
- Phase 3 stills: `?start=branding`, `?start=showpiece`, `?showpieceFrame=nest\|egg\|hatch\|house`

## Not in Phase 5

Firebase/Firestore shopping/calendar, overnight dimming, Picovoice, naming the model on the UI, traffic, fuel, sunrise/sunset, moon, Dollar Tree.

Future work is listed as stubs only in [PHASES.md](./PHASES.md).

## Screenshots

Landscape web preview of the listen → answer path (fridge install path is still the Android APK):

- [Egg listening](./docs/phase-5-listening.png)
- [Talking egg + answer](./docs/phase-5-talking.png)
- [Muted](./docs/phase-5-mute.png)

Phase 4 wake/sleep: [idle dashboard](./docs/phase-4-dashboard.png), [listening](./docs/phase-4-listening.png), [exit](./docs/phase-4-exit.png), [mic needed](./docs/phase-4-mic.png).

Phase 3 branding stills: [house in the nest](./docs/phase-3-branding.png), [hatch nest](./docs/phase-3-hatch-nest.png), [hatch open](./docs/phase-3-hatch-open.png), [hatch house](./docs/phase-3-hatch-house.png).

Phase 2 cards: [weather](./docs/phase-2-weather.png), [Fox News](./docs/phase-2-news.png), [history](./docs/phase-2-history.png), [verse](./docs/phase-2-verse.png).

## Requirements

- Node.js 22.13+ (SDK 57)
- npm
- For **EAS cloud builds**: an Expo account (`npx eas-cli login`)
- For **local APKs**: Android Studio / Android SDK + JDK 17 or 21
- NDK is pulled in by `expo-sherpa-onnx` on Android prebuild
- A Gemini API key for answers (`EXPO_PUBLIC_GEMINI_API_KEY`)

## Setup

```sh
git clone https://github.com/shootngo/nestor-assistant.git
cd nestor-assistant
npm install
cp .env.example .env   # then paste EXPO_PUBLIC_GEMINI_API_KEY
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

## APK for the fridge tablet (no Metro)

Install a **preview APK** so the tablet does not need a computer. Rebuild after pulling Phase 5 — speech in/out is native, and the Gemini key is baked in at bundle time.

### Option A — EAS Build (recommended)

One-time:

```sh
npx eas-cli login
npx eas-cli init    # creates the Expo project; accept the slug nestor-assistant
npx eas-cli secret:create --name EXPO_PUBLIC_GEMINI_API_KEY --value "your-key-here" --scope project
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
| `preview` | Standalone APK for the fridge (use this for Phase 5 sign-off) |
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

If you use a local `.env`, Gradle/Metro must see `EXPO_PUBLIC_GEMINI_API_KEY` at bundle time. EAS preview should use the EAS secret instead.

## Install on a Fire tablet (Play Store already installed)

Treat the device as plain Android.

### Enable unknown sources

1. Copy the APK to the tablet (USB, Drive, email, or `adb` below).
2. Open **Settings → Security & privacy** (wording varies by Fire OS).
3. Enable **Apps from Unknown Sources** / **Install unknown apps** for **Files**, **Chrome**, or whichever app you use to open the APK.
4. Open the APK and install **Nestor**.

If Android blocks the install, tap **Settings** on the prompt and allow that source, then retry.

### USB debugging (`adb install`)

1. **Settings → Device options** (tap the serial number seven times if that menu is hidden).
2. Enable **USB debugging** / **ADB**.
3. Plug in the tablet, accept the RSA prompt.
4. From a machine with platform-tools:

```sh
adb devices
adb install -r path/to/app-release.apk
```

Replace an older build with `-r`. The launcher name is **Nestor**.

### After install

1. Open **Nestor**.
2. Allow the microphone when Android asks. If you deny it, a cream card explains why; **Continue to the kitchen board** keeps the dashboard running.
3. Rotate the tablet to landscape (or mount it on the fridge).
4. Confirm the charcoal dashboard still cycles. Say **Nestor**. The egg should appear.
5. Ask a general question (“How long should I rest a roast?”). Nestor should speak the answer and show it in large type. The mouth should move unless **Mute** is on.
6. Ask a follow-up without saying **Nestor** again. Then say **Goodbye Nestor** (or wait five quiet minutes). The egg should walk off.
7. Use **Mute** / **–** / **+** on the egg screen if the kitchen is too loud or too quiet.
8. Keep the tablet plugged in.

Speech-to-text uses whatever recognizer the Fire tablet already has (Play Store / Google speech, or Amazon’s). It is free OS STT, not a paid cloud SKU.

## Identity

On screen and in spoken copy, the assistant is **Nestor**. Never show a model name in the UI.

## Test notes

See [docs/TEST_NOTES.md](./docs/TEST_NOTES.md).
