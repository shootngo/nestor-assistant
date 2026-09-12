# Overnight dim (Phase 7)

Primary fridge device is a **Samsung Tab A** (small, about five years old / ~2021, plain Android / Play Store). It sits **sideways on top of the fridge** — **landscape**, always-on, plugged in. Type is sized to stay readable on that smaller screen from across the kitchen.

From about **10pm to 6am** America/Chicago the kitchen board stays on, but the screen goes quiet: a dark veil covers the cycling cards and a large faint clock stays readable. At 6am it fades back to full dashboard brightness. Hours live in `src/config.ts`:

```
OVERNIGHT_DIM_START_HOUR = 22
OVERNIGHT_DIM_END_HOUR = 6
```

Rebuild the JS/APK after changing those numbers. The window may wrap midnight (the kitchen default does). Set start and end to the same hour to disable dimming.

## What stays awake

- Keep-awake and landscape kiosk chrome are unchanged. The tablet does not go black or sleep.
- Dashboard cards and branding still cycle under the veil.
- **Nestor** still hears his name. The veil lifts for the egg session, then fades back after **Goodbye Nestor** or the usual quiet timeout.
- Night answers are **quieter** (TTS volume is scaled down). **Mute** still silences him completely. **–** / **+** still change the tablet media stream.

## Dim: overlay first

Older Samsung Tabs are flaky with brightness APIs (flicker, no-op, or they fail to restore). **Do not rely on them.**

1. **Veil + faint clock (the night look).** A full-screen dim overlay and a large clock. This is what Frank sees. Always on during the overnight window when no wake session is up.
2. **Activity window brightness (off by default).** `OVERNIGHT_USE_WINDOW_BRIGHTNESS` in `src/config.ts` is `false`. Leave it off on this Tab. If a newer tablet is later proven to honor `setBrightnessAsync`, it can be turned on — still no `WRITE_SETTINGS` / Modify system settings prompt.

Keep the tablet plugged in. Overnight dim is not a power-off. Leave battery saver / sleep optimizations off for **Nestor**.

## Android version (~2021 Tab)

The APK pins **`minSdkVersion` 24** (Android 7). That still runs on a ~2021 Tab A (typically Android 10/11). Do not raise minSdk to 33+ or the fridge Tab A will not install.

## Fire tablet (secondary)

If the old Fire is still around, the same APK runs. The veil + clock are the night look there too.

## Web preview

Ignored on the APK:

```
?night=1
?night=1&clock=10:42&period=PM
?night=0
?session=listen&night=1
?night=1&wakeTap=1
```
