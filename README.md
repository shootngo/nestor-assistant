# Nestor Assistant

Kitchen Fire-tablet kiosk for Frank Mulkey’s Nestor household app. The on-screen and spoken identity is **Nestor**. Do not name or show the underlying AI model.

This repo is an Expo (React Native) Android app. It is **not** an Expo Go project — native modules arrive in later phases, so builds use `expo-dev-client` and prebuild.

## Phase 1 (this PR)

A sideloadable landscape kiosk shell so the fridge tablet can run Nestor at all:

- Expo SDK 57 + `expo-dev-client` + Android prebuild
- Display name **Nestor**, package id `com.shootngo.nestorassistant`
- Full-screen charcoal placeholder: title **Nestor**, subtitle **Kitchen assistant — Phase 1**, fridge-tablet shell line
- Screen stays on (`FLAG_KEEP_SCREEN_ON` / `expo-keep-awake`)
- Landscape preferred; system bars hidden as much as Android allows (immersive sticky)

Confirm Phase 1 on the tablet before any later phase.

## Not in Phase 1

Wake/sleep word, Porcupine, SpeechRecognizer, TTS, Gemini, Firebase/Firestore, shopping/calendar, egg face, dashboard cards, news/weather, overnight dimming.

Future work is listed as stubs only in [PHASES.md](./PHASES.md).

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

## Development build (USB tablet + Metro)

Use this when iterating on JS. The tablet must reach the machine running Metro (same Wi-Fi, or USB).

```sh
npx expo run:android --device
# or after a one-time native build:
npx expo start --dev-client
```

`expo-dev-client` is required. Do not use Expo Go.

## APK for the fridge tablet (no Metro)

Phase 1 is a static shell. Install a **preview APK** so the tablet does not need a computer.

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
| `preview` | Standalone APK for the fridge (use this for Phase 1 sign-off) |
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
3. Confirm the charcoal **Nestor** placeholder, the Phase 1 subtitle, and that the screen stays on.
4. Keep the tablet plugged in.

## Identity

On screen and in later voice copy, the assistant is **Nestor**. Never show a model name in the UI.

## Test notes

See [docs/TEST_NOTES.md](./docs/TEST_NOTES.md). Placeholder UI: [docs/phase-1-placeholder.png](./docs/phase-1-placeholder.png).
