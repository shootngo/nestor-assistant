# Phases

Frank’s kitchen-tablet build order. Phase 4 (this PR) is always-listening wake / sleep. Later phases stay stubs.

## 1. Tablet shell — done

Expo Android kiosk: landscape, keep-awake, immersive-ish system UI, sideload APK. No voice, no cloud, no dashboard.

## 2. Idle dashboard loop — done

Cycling charcoal cards (~10 seconds each) for fridge viewing:

- Weather for **Southaven, Mississippi** (Open-Meteo, no key)
- Fox News headlines with photos (public RSS)
- This day in history (Wikipedia On This Day REST API)
- Bible verse of the day (OurManna, with bible-api.com + local fallback)

## 3. Branding + hatch — done

House-in-the-nest stills in the same carousel, plus a rare silent hatch showpiece.

- Frequent cards: official PWA house-in-the-nest icon and a short rotating line (“Nestor here”, “Nestor ready for business”, …)
- Every `BRANDING_SHOWPIECE_EVERY` branding pass (default **10**): official splash (cracked egg + cottage) → shell fragments float out with a slow zoom → large serif **Nestor** → **Hi, I'm Nestor, your personal assistant**
- Visual only. No TTS, no music

## 4. Wake / sleep — **this repo, now**

Always-listening on-device keyword spotting. Picovoice / Porcupine is **abandoned**: their console rejects personal Gmail and free-tier AccessKeys are discontinued. Phase 4 uses **sherpa-onnx** KWS instead (no AccessKey, no `.ppn`, no network wake service).

- Wake phrase **Nestor** (configurable; fallback **Hey Nestor** if the single word is jumpy)
- Sleep phrase **Goodbye Nestor**, or ~5 minutes of silence
- On wake: dashboard pauses, cream/sage egg listening face (calm idle / blink)
- On sleep: unhurried chicken-legs exit, then the idle loop resumes
- `RECORD_AUDIO` + a calm “mic needed” card if permission is denied (kiosk does not brick)
- No SpeechRecognizer capture, no Gemini, no TTS answers

## 5. Listen → answer

Speech in, Nestor’s spoken reply, and the kitchen conversation loop. Talking-mouth motion belongs here. On-screen identity stays **Nestor**; do not name the model. Not started.

## 6. Household data

Firestore / existing Nestor PWA data: shopping, calendar, and related household state. Not started.

## 7. Overnight presence

Dim / ambient overnight mode. Not started.
