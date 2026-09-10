# Phase 1 test notes

Confirm this on the Fire tablet (or an Android emulator / landscape web preview) before Phase 2.

## Prebuild

From a clean checkout:

```sh
npm install
npx expo prebuild --platform android
npx expo-doctor
```

Expect `android/` with application id `com.shootngo.nestorassistant` and launcher name Nestor. Native `MainActivity` should set `FLAG_KEEP_SCREEN_ON` and hide system bars. Native folders are gitignored; regenerating them is expected.

Verified in this Phase 1 change: `npx expo prebuild --platform android --clean` succeeds, `npx tsc --noEmit` is clean, and `expo-doctor` reports 21/21.

## Installable APK

- EAS: `npx eas-cli build -p android --profile preview` produces an APK (not an AAB).
- Local: `npx expo prebuild --platform android` then `cd android && ./gradlew assembleDebug`.

## On device

| Check | Expected |
| --- | --- |
| Launcher name | **Nestor** |
| First screen | Charcoal background, title **Nestor**, subtitle **Kitchen assistant — Phase 1**, line **This is the fridge tablet shell.** |
| Orientation | Landscape preferred |
| Sleep | Screen stays on while the app is in the foreground (tablet should stay plugged in) |
| System UI | Status / navigation bars hidden or overlay-swipe (Fire OS may still show a thin bar) |
| Identity | No model name anywhere on screen |
| Out of scope | No mic, wake word, TTS, dashboard cards, egg animation, or sign-in |

## Web preview (optional)

`npx expo start --web` is only for a quick look at the placeholder. It is not the fridge install path. Keep-awake and immersive bars apply on Android.
