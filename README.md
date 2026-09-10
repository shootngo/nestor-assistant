# Nestor Assistant

Kitchen Fire-tablet kiosk for Frank Mulkey’s Nestor household app. The on-screen and spoken identity is **Nestor**. Do not name or show the underlying AI model.

This repo is an Expo (React Native) Android app. It is **not** an Expo Go project — native modules arrive in later phases, so builds use `expo-dev-client` and prebuild.

## Phase 3 (this PR)

Branding sits in the Phase 2 idle loop. Landscape charcoal cards still cycle weather / Fox News / On This Day / verse. Two **house-in-the-nest** stills join each pass, with a short silent line. Every Nth branding slot (default **every 10th**) is replaced by the hatch showpiece, matched to the household PWA splash and Frank’s reference clip: cracked egg + cottage, shell fragments floating out, slow zoom, serif **Nestor**, then **Hi, I'm Nestor, your personal assistant**. Visual only — no TTS, no music.

| Card | What you see |
| --- | --- |
| Weather — Southaven, Mississippi | Open-Meteo current + today’s high/low |
| News headlines | Fox News RSS, one headline per turn, photo when present |
| This day in history | Wikipedia On This Day for the Chicago calendar date |
| Branding (frequent) | Official PWA house-in-the-nest icon + a rotating line (`Nestor here`, `Nestor ready for business`, …) |
| Hatch showpiece (rare) | Silent RN Animated sequence (~5s motion); dwell `BRANDING_SHOWPIECE_MS` (10s) |
| Verse of the day | OurManna, then bible-api.com, then a local Psalm 118:24 |

Art is under `assets/branding/`. Official PWA files (also in `assets/branding/source/`):

- [splash.png](https://raw.githubusercontent.com/shootngo/Nestor/main/assets/splash.png) — hatch start still
- [splash.jpg](https://raw.githubusercontent.com/shootngo/Nestor/main/assets/splash.jpg)
- [icon-512.png](https://raw.githubusercontent.com/shootngo/Nestor/main/icon-512.png)
- [icon-source.png](https://raw.githubusercontent.com/shootngo/Nestor/main/assets/icon-source.png) — simple branding still

Mid/end hatch stills (shatter + revealed cottage) were composed to match that splash. Live PWA: https://shootngo.github.io/Nestor/

There is no listening blink, talking mouth, or walk-off — those wait for listen → answer.

Phase 1–2 kiosk behavior is unchanged: keep-awake, landscape lock, immersive system bars, launcher name **Nestor**. The corner wordmark stays on ordinary cards and yields during the full-screen showpiece.

Offline / fetch errors still show a calm “Couldn’t load …” card. The app must not crash the kiosk.

### Config knobs (`src/config.ts`)

| Knob | Default | Meaning |
| --- | --- | --- |
| `CARD_INTERVAL_MS` | `10000` | Dwell for weather, news, history, verse, and simple branding |
| `CARD_FADE_MS` | `520` | Fade between cards |
| `BRANDING_SHOWPIECE_EVERY` | `10` | Hatch replaces a branding still on every Nth branding pass. Use `5` or `20` if you want it more or less often. `1` = every branding slot |
| `BRANDING_SHOWPIECE_MS` | `10000` | Showpiece dwell (~5s hatch + mark/greeting hold) |
| `PLAYLIST_REFRESH_MS` | 15 minutes | Reload remote feeds |

Web preview only (ignored on the APK):

- `?start=branding` — open on the first house-in-the-nest card
- `?start=showpiece` — open on the hatch
- `?showpieceEvery=1` or `?showpiece=1` — hatch every branding slot
- `?showpieceFrame=nest\|egg\|hatch\|house` — freeze one showpiece keyframe

## Not in Phase 3

Wake/sleep word, Porcupine, SpeechRecognizer, TTS, Gemini, Firebase/Firestore, shopping/calendar, listening/talking egg face, overnight dimming, traffic, fuel, sunrise/sunset, moon, Dollar Tree.

Future work is listed as stubs only in [PHASES.md](./PHASES.md).

## Screenshots

Landscape web preview (fridge install path is still the Android APK):

- [Simple branding — house in the nest](./docs/phase-3-branding.png)
- [Hatch — cracked egg + Nestor / Home, held gently](./docs/phase-3-hatch-nest.png)
- [Hatch — shell opening / zoom](./docs/phase-3-hatch-open.png)
- [Hatch — house revealed + serif Nestor](./docs/phase-3-hatch-house.png)

Phase 2 cards (still in the loop): [weather](./docs/phase-2-weather.png), [Fox News](./docs/phase-2-news.png), [history](./docs/phase-2-history.png), [verse](./docs/phase-2-verse.png).

## Requirements

- Node.js 22.13+ (SDK 57)
- npm
- For **EAS cloud builds**: an Expo account (`npx eas-cli login`)
- For **local APKs**: Android Studio / Android SDK + JDK 17 or 21

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

`expo-dev-client` is required. Do not use Expo Go.

Web preview (`npx expo start --web`) is only for a quick look at the dashboard. Keep-awake and immersive bars apply on Android.

## APK for the fridge tablet (no Metro)

Install a **preview APK** so the tablet does not need a computer. Rebuild after pulling Phase 3:

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
| `preview` | Standalone APK for the fridge (use this for Phase 3 sign-off) |
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
2. Rotate the tablet to landscape (or mount it on the fridge).
3. Confirm the charcoal dashboard: weather, Fox headlines, history, verse, and the house-in-the-nest branding cards. About every tenth branding card should run the silent hatch (serif **Nestor**, then the greeting). Cards advance about every 10 seconds. The screen stays on. No sound.
4. Keep the tablet plugged in.

## Identity

On screen and in later voice copy, the assistant is **Nestor**. Never show a model name in the UI.

## Test notes

See [docs/TEST_NOTES.md](./docs/TEST_NOTES.md).
