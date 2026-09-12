# Overnight dim (Phase 7)

From about **10pm to 6am** America/Chicago the kitchen board stays on, but the screen goes quiet: a dark veil over the cycling cards and a large faint clock. At 6am it fades back to full brightness. Hours live in `src/config.ts`:

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

## Brightness on a Fire tablet

Two layers:

1. **Veil + faint clock (always).** A full-screen dim overlay. This is the reliable night look on Fire OS.
2. **Activity window brightness (best-effort).** On Android the app tries `expo-brightness` `setBrightnessAsync` for the current window only. That does **not** need the special **Modify system settings** (`WRITE_SETTINGS`) permission.

Fire OS quirks:

- Many Fire tablets ignore or reset window brightness. The veil still dims the picture.
- Do **not** grant “Modify system settings” unless you are experimenting. Nestor does not open that Settings page and does not write global system brightness.
- If the screen still looks bright, the veil is doing the work — that is expected.
- Keep the tablet plugged in. Overnight dim is not a power-off.

## Web preview

Ignored on the APK:

```
?night=1
?night=1&clock=10:42&period=PM
?night=0
?session=listen&night=1
?night=1&wakeTap=1
```
