# Phases

Phase 2 (idle dashboard) is implemented on top of the Phase 1 kiosk shell. Later phases stay stubs.

## 1. Tablet shell — done

Expo Android kiosk: landscape, keep-awake, immersive-ish system UI, sideload APK. No voice, no cloud, no dashboard.

## 2. Idle dashboard loop — **this repo, now**

Cycling charcoal cards (~10 seconds each) for fridge viewing:

- Weather for **Southaven, Mississippi** (Open-Meteo, no key)
- Fox News headlines with photos (public RSS)
- This day in history (Wikipedia On This Day REST API)
- Bible verse of the day (OurManna, with bible-api.com + local fallback)

No wake word, speech, Gemini, Firebase, egg-face animation, hatch branding showpiece, or overnight dimming.

## 3. Wake / sleep word

Porcupine (or equivalent) always-listening wake and sleep phrases. Not started.

## 4. Speech in / speech out

Android SpeechRecognizer for capture and TTS for Nestor’s replies. Not started.

## 5. Nestor brain

Connect the tablet to the household assistant backend. On-screen identity stays **Nestor**; do not name the model. Not started.

## 6. Household data

Firestore / existing Nestor PWA data: shopping, calendar, and related household state. Not started.

## 7. Egg face / hatch branding

Idle egg-face animation and hatch branding showpiece. Not started. (Kept separate from the Phase 2 card loop.)

## 8. Overnight presence

Dim / ambient overnight mode. Not started.
