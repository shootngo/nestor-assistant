# Overnight dim (Phase 7)

Primary fridge device is a **Samsung Tab** (plain Android / Play Store): landscape, always-on, plugged in. From about **10pm to 6am** America/Chicago the kitchen board stays on, but the screen goes quiet: the backlight dims, a dark veil covers the cycling cards, and a large faint clock stays readable. At 6am it fades back to full brightness. Hours live in `src/config.ts`:

```
OVERNIGHT_DIM_START_HOUR = 22
OVERNIGHT_DIM_END_HOUR = 6
```

Rebuild the JS/APK after changing those numbers. The window may wrap midnight (the kitchen default does). Set start and end to the same hour to disable dimming.

## What stays awake

- Keep-awake and landscape kiosk chrome are unchanged. The tablet does not go black or sleep.
- Dashboard cards and branding still cycle under the veil.
- **Nestor** still hears his name. The veil lifts for the egg session (full window brightness), then fades back after **Goodbye Nestor** or the usual quiet timeout.
- Night answers are **quieter** (TTS volume is scaled down). **Mute** still silences him completely. **–** / **+** still change the tablet media stream.

## Brightness on a Samsung Tab

Two layers. Prefer the real Android API; keep the veil either way.

1. **Activity window brightness (Samsung / plain Android).** `expo-brightness` `setBrightnessAsync` on the current window. Night uses `OVERNIGHT_WINDOW_BRIGHTNESS` (default `0.08`). Day and night-wake use `OVERNIGHT_DAY_WINDOW_BRIGHTNESS` (default `1`). That does **not** need **Modify system settings** (`WRITE_SETTINGS`). Nestor does not open that Settings page and does not write global system brightness.
2. **Veil + faint clock (always).** A full-screen dim overlay with the large clock. This is the picture if window brightness is ignored, and it is the faint-clock face even when the backlight does dim.

Samsung notes:

- Adaptive / auto brightness can still fight the window level a little. If the board looks too bright or too dark, turn **Adaptive brightness** off for the kiosk and leave Nestor in the foreground.
- Keep the tablet plugged in. Overnight dim is not a power-off. Leave battery saver / sleep optimizations off for **Nestor** so always-on keep-awake is not killed.
- Do **not** grant “Modify system settings” unless you are experimenting.

## Fire tablet (secondary)

If the old Fire is still around, the same APK runs. Many Fire tablets ignore or reset window brightness. The veil + clock still dim the picture. That is expected. Do not chase Fire brightness permissions.

## Web preview

Ignored on the APK:

```
?night=1
?night=1&clock=10:42&period=PM
?night=0
?session=listen&night=1
?night=1&wakeTap=1
```
