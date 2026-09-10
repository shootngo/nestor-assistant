# Phases

Frank’s kitchen-tablet build order. Phase 3 (this PR) is branding cards plus the hatch showpiece inside the idle loop. Later phases stay stubs.

## 1. Tablet shell — done

Expo Android kiosk: landscape, keep-awake, immersive-ish system UI, sideload APK. No voice, no cloud, no dashboard.

## 2. Idle dashboard loop — done

Cycling charcoal cards (~10 seconds each) for fridge viewing:

- Weather for **Southaven, Mississippi** (Open-Meteo, no key)
- Fox News headlines with photos (public RSS)
- This day in history (Wikipedia On This Day REST API)
- Bible verse of the day (OurManna, with bible-api.com + local fallback)

## 3. Branding + hatch — **this repo, now**

House-in-the-nest stills in the same carousel, plus a rare silent hatch showpiece.

- Frequent cards: official PWA house-in-the-nest icon and a short rotating line (“Nestor here”, “Nestor ready for business”, …)
- Every `BRANDING_SHOWPIECE_EVERY` branding pass (default **10**; 5 or 20 are the other usual settings): official splash (cracked egg + cottage) → shell fragments float out with a slow zoom → large serif **Nestor** → **Hi, I'm Nestor, your personal assistant**
- Visual only. No TTS, no music, no wake word, no listening/talking egg face

## 4. Wake / sleep

Porcupine (or equivalent) always-listening wake and sleep phrases. Not started.

## 5. Listen → answer

Speech in, Nestor’s spoken reply, and the kitchen conversation loop. Listening / talking egg-face motion belongs here, not in Phase 3. On-screen identity stays **Nestor**; do not name the model. Not started.

## 6. Household data

Firestore / existing Nestor PWA data: shopping, calendar, and related household state. Not started.

## 7. Overnight presence

Dim / ambient overnight mode. Not started.
