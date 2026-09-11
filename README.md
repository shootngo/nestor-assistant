# Nestor Assistant

Kitchen Fire-tablet kiosk for Frank Mulkey’s Nestor household app. The on-screen and spoken identity is **Nestor**. Do not name or show the underlying AI model.

This repo is an Expo (React Native) Android app. It is **not** an Expo Go project — native modules (keyword spotting + microphone) require `expo-dev-client` and prebuild.

## Phase 4 (this PR)

Always-listening wake and sleep on the fridge tablet. The idle dashboard from Phase 2–3 keeps cycling until someone says **Nestor**. Then the board pauses and a cream/sage egg listening face sits there — calm blink, restful, no talking mouth yet. **Goodbye Nestor**, or about five minutes of quiet, and the egg grows little chicken legs and walks off. The dashboard resumes.

Picovoice / Porcupine is **out**. Their console rejects personal Gmail, and free-tier AccessKeys are discontinued. Phase 4 uses **on-device open-source keyword spotting** instead.

### Why `expo-sherpa-onnx`

Evaluated against this Expo SDK 57 + `expo-dev-client` Android prebuild stack:

| Package | Decision |
| --- | --- |
| **`expo-sherpa-onnx`** | **Chosen.** Real Expo module (`expo-module.config.json`), ships `libsherpa-onnx-jni.so`, and exposes `createKeywordSpotter` / streaming `acceptWaveform`. Autolinks with `npx expo prebuild`. |
| `@siteed/sherpa-onnx.rn` | Mature RN wrapper (listed upstream by sherpa-onnx) with a high-level KWS helper, but it is a 100MB+ TurboModule plus an Expo config plugin pinned to `@expo/config-plugins` 56. Heavier than we need for wake/sleep only. |
| `react-native-sherpa-onnx` | Extra FS / downloader peers; KWS is not the focus. |

Microphone capture is a small **local Expo module** (`modules/nestor-mic`): Android `AudioRecord` at 16 kHz mono. Expo’s own recorder writes files and does not stream PCM, which sherpa-onnx needs. No Picovoice AccessKey, no `.ppn`, no network wake service.

The English KWS graph is **shipped in-repo** under `assets/kws/` (int8 zipformer, ~5 MB). On first run it is copied to the app document directory so the native spotter can open real files.

Phase 4 may show **Listening…** / **Say Goodbye Nestor to dismiss**. It does **not** call Gemini or SpeechRecognizer for Q&A.

### Config knobs (`src/config.ts`)

Wake / sleep:

| Knob | Default | Meaning |
| --- | --- | --- |
| `WAKE_PHRASE` | `nestor` | `nestor` or `hey_nestor`. Switch to `hey_nestor` if “Nestor” alone is jumpy — same phase, no redesign |
| `KWS_KEYWORDS_THRESHOLD` | `0.32` | Global sherpa-onnx threshold. **Higher = less sensitive.** Per-keyword `#` in the keywords file wins |
| `KWS_KEYWORDS_SCORE` | `1.2` | Boost. Prefer retuning `#threshold` first |
| `LISTENING_SILENCE_MS` | `300000` | ~5 minutes of quiet → exit |
| `LISTENING_VOICE_RMS` | `0.018` | Mic energy that resets the silence timer (raise if the fridge hum keeps him up) |
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

To encode a new phrase (UPPERCASE):

```sh
pip install sentencepiece
python3 -c "import sentencepiece as spm; sp=spm.SentencePieceProcessor(model_file='assets/kws/bpe.model'); print(' '.join(sp.encode('HEY NESTOR', out_type=str)))"
```

More detail: [assets/kws/README.md](./assets/kws/README.md).

If you ever need to re-download the upstream graph:

```sh
npm run fetch-kws-model
```

Web preview only (ignored on the APK):

- `?session=listen` — egg listening face
- `?session=exit` — chicken-legs walk-off, then the dashboard
- `?session=exit&hold=1` — freeze mid-walk for a still
- `?session=mic` — calm “mic needed” card
- `?wakeTap=1` — tap the dashboard to wake
- Phase 3 stills: `?start=branding`, `?start=showpiece`, `?showpieceFrame=nest\|egg\|hatch\|house`

## Not in Phase 4

SpeechRecognizer capture of utterances, Gemini answers, TTS, Firebase/Firestore shopping/calendar, talking-mouth egg, overnight dimming, traffic, fuel, sunrise/sunset, moon, Dollar Tree.

Future work is listed as stubs only in [PHASES.md](./PHASES.md).

## Screenshots

Landscape web preview of the wake/sleep path (fridge install path is still the Android APK):

- [Idle dashboard](./docs/phase-4-dashboard.png)
- [Egg listening](./docs/phase-4-listening.png)
- [Egg exit](./docs/phase-4-exit.png)
- [Mic needed](./docs/phase-4-mic.png)

Phase 3 branding stills: [house in the nest](./docs/phase-3-branding.png), [hatch nest](./docs/phase-3-hatch-nest.png), [hatch open](./docs/phase-3-hatch-open.png), [hatch house](./docs/phase-3-hatch-house.png).

Phase 2 cards: [weather](./docs/phase-2-weather.png), [Fox News](./docs/phase-2-news.png), [history](./docs/phase-2-history.png), [verse](./docs/phase-2-verse.png).

## Requirements

- Node.js 22.13+ (SDK 57)
- npm
- For **EAS cloud builds**: an Expo account (`npx eas-cli login`)
- For **local APKs**: Android Studio / Android SDK + JDK 17 or 21
- NDK is pulled in by `expo-sherpa-onnx` on Android prebuild

## Setup

```sh
git clone https://github.com/shootngo/nestor-assistant.git
cd nestor-assistant
npm install
```

Native `android/` is generated, not committed:

```sh
npx expo prebuild --platform android
```

`--clean` regenerates from `app.json` if native folders already exist (`npx expo prebuild --platform android --clean`).

Optional feed check (documents which Fox RSS URL works):

```sh
npm run check-feeds
```

## Development build (USB tablet + Metro)

Use this when iterating on JS. The tablet must reach the machine running Metro (same Wi-Fi, or USB).

```sh
npx expo run:android --device
# or after a one-time native build:
npx expo start --dev-client
```

`expo-dev-client` is required. Do not use Expo Go — sherpa-onnx and the kitchen mic module will not be there.

Web preview (`npx expo start --web`) is only for a quick look at the dashboard and egg UI. Keep-awake, immersive bars, and keyword spotting apply on Android.

## APK for the fridge tablet (no Metro)

Install a **preview APK** so the tablet does not need a computer. Rebuild after pulling Phase 4 — native KWS changed.

### Option A — EAS Build (recommended)

One-time:

```sh
npx eas-cli login
npx eas-cli init    # creates the Expo project; accept the slug nestor-assistant
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
| `preview` | Standalone APK for the fridge (use this for Phase 4 sign-off) |
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
4. Confirm the charcoal dashboard still cycles. Say **Nestor**. The egg should appear. Say **Goodbye Nestor** (or wait five quiet minutes). The egg should walk off.
5. Keep the tablet plugged in.

## Identity

On screen and in later voice copy, the assistant is **Nestor**. Never show a model name in the UI.

## Test notes

See [docs/TEST_NOTES.md](./docs/TEST_NOTES.md).
