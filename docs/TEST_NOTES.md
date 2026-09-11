# Test notes

## Phase 5 — listen → answer

Confirm on the Fire tablet after installing a rebuilt APK with `GEMINI_API_KEY` or `EXPO_PUBLIC_GEMINI_API_KEY` baked in. Web preview can show the egg UI, mute control, and talking mouth but **cannot** run SpeechRecognizer, TTS, or the kitchen brain.

### Engine

| Piece | What we use |
| --- | --- |
| Wake / sleep | Unchanged from Phase 4: `expo-sherpa-onnx` + `modules/nestor-mic` |
| Speech in | `modules/nestor-voice` → Android `SpeechRecognizer` (prefer on-device / offline, then OS recognizer) |
| Brain | Gemini API `generateContent` + `tools: [{ google_search: {} }]`. Key: `GEMINI_API_KEY` or `EXPO_PUBLIC_GEMINI_API_KEY` |
| Speech out | Android `TextToSpeech` in `nestor-voice`, plus large on-screen text |
| Mute / volume | On-screen **Mute** / **–** / **+** |
| Abandoned | Picovoice / Porcupine; naming the model on UI; Firestore tools |

### App checks

| Check | Expected |
| --- | --- |
| Launcher name | **Nestor** |
| Identity | No model name anywhere. Egg never says Gemini / Google / sherpa / Picovoice |
| Idle | Phase 3 dashboard still cycles |
| Wake | Say **Nestor** → egg, **Listening…**, mute controls visible |
| Request | “How long should I rest a roast?” → thinking → spoken answer + large text + talking mouth |
| Chatter | “yeah” / “hmm” → stay listening, no answer |
| Follow-up | Next question without the wake word still answers |
| Sleep | **Goodbye Nestor** (spoken) or ~5 minutes quiet → chicken-legs exit → dashboard |
| Mute | **Mute** stops TTS; answer still on screen; mouth rests. **+** unmutes |
| Missing key | Wakes and listens; spoken/on-screen line about the kitchen key — no vendor name |
| Keep-awake | Screen stays on; landscape; immersive bars |
| Out of scope | No Firestore / shopping / calendar, no overnight dim |

### Expected Fire-tablet conversation test (not runnable in CI)

This environment has no Fire tablet microphone. On the fridge tablet, after sideloading the Phase 5 APK:

1. Open **Nestor**, allow the microphone.
2. Say **Nestor**. Egg appears. Ask **How long should I rest a roast?** He should talk and show the answer. Mouth moves.
3. Ask a follow-up (**What about chicken?**) without saying Nestor again.
4. Tap **Mute** and ask again. Text still appears; no voice.
5. Say **Goodbye Nestor**. Egg walks off.
6. If STT never hears you but wake still works, the tablet’s recognizer may be missing. Nestor should say speech-to-text isn’t on this tablet and **Goodbye Nestor** should still work via the Phase 4 spotter.

### Gemini key

```
cp .env.example .env
# GEMINI_API_KEY=...
# or EXPO_PUBLIC_GEMINI_API_KEY=...
```

EAS (either name): `npx eas-cli secret:create --name GEMINI_API_KEY --value "..." --scope project`

Rebuild the APK after setting the key. Never commit `.env`. `app.config.js` maps `GEMINI_API_KEY` onto Expo’s public slot at bundle time.

### Web preview (UI only)

```
?session=listen
?session=talk
?session=talk&hold=1
?session=mute
?session=exit
?session=exit&hold=1
?session=mic
?wakeTap=1
```

Verified in this Phase 5 change: `npx tsc --noEmit` and `npm run check-listen` are clean. Landscape web preview at 1280×800 shows listening, talking egg + answer, and mute. Identity stayed **Nestor**. Full Fire-tablet STT / TTS / grounded answers still need a sideloaded APK with a key.

### Rebuild APK

After `npm install` and setting the Gemini key:

- EAS: `npx eas-cli build -p android --profile preview`
- Local: `npx expo prebuild --platform android` then `cd android && ./gradlew assembleDebug`

Sideload with `adb install -r`. `expo-sherpa-onnx`, `nestor-mic`, and `nestor-voice` are native — Expo Go will not work.

## Phase 4 — wake / sleep

Still required. Web preview can show the egg UI but **cannot** run on-device KWS (no Android mic module).

### Engine

| Piece | What we use |
| --- | --- |
| KWS | `expo-sherpa-onnx` + bundled English zipformer (GigaSpeech int8) |
| Mic | local Expo module `modules/nestor-mic` (`AudioRecord` 16 kHz mono) |
| Wake | `Nestor` (`WAKE_PHRASE = 'nestor'`) |
| Sleep | `Goodbye Nestor`, or ~5 minutes without speech |
| Abandoned | Picovoice / Porcupine (no AccessKey, no `.ppn`) |

### Config knobs (`src/config.ts`)

| Knob | Default | Notes |
| --- | --- | --- |
| `WAKE_PHRASE` | `nestor` | Switch to `hey_nestor` if the single word false-triggers |
| `KWS_KEYWORDS_THRESHOLD` | `0.32` | Global default. Per-keyword `#` in `assets/kws/keywords.*.txt` wins |
| `KWS_KEYWORDS_SCORE` | `1.2` | Boost. Prefer raising `#threshold` to quiet false wakes |
| `LISTENING_SILENCE_MS` | `300000` | 5 minutes |
| `LISTENING_VOICE_RMS` | `0.018` | Fridge-hum filter for the silence timer |
| `EGG_EXIT_MS` | `2800` | Unhurried walk-off |
| `ALLOW_WAKE_SIMULATE` | `true` | Tap or long-press the wordmark / listening egg to preview without speaking |

Per-keyword thresholds already shipped:

| Phrase | `#threshold` | Why |
| --- | --- | --- |
| `nestor` | `0.42` | Short word — higher bar |
| `hey_nestor` | `0.28` | Two-word fallback |
| `goodbye_nestor` | `0.22` | Longer dismiss phrase |

### App checks

| Check | Expected |
| --- | --- |
| Launcher name | **Nestor** |
| Identity | No model name anywhere |
| Idle | Phase 3 dashboard still cycles (weather, Fox, history, verse, nest, rare hatch) |
| Mic prompt | First launch asks for the microphone. Deny → cream “mic needed” card |
| Wake | Say **Nestor** → dashboard pauses → cream egg |
| Sleep | Say **Goodbye Nestor** → little legs, unhurried run off screen → dashboard resumes |
| Keep-awake | Screen stays on; landscape; immersive bars |

## Phase 3 — branding + hatch

Still required inside the idle loop. Hatch is visual only.

| Knob | Default | Notes |
| --- | --- | --- |
| `CARD_INTERVAL_MS` | 10000 | Ordinary cards, including simple branding |
| `BRANDING_SHOWPIECE_EVERY` | **10** | Hatch on the 10th, 20th, … branding pass |
| `BRANDING_SHOWPIECE_MS` | 10000 | ~5s hatch motion + hold |

Web preview overrides: `?start=branding`, `?start=showpiece`, `?showpieceEvery=1`, `?showpieceFrame=nest|egg|hatch|house`.

## Phase 2 — idle dashboard

Still required: weather (Southaven), Fox News, On This Day, verse. Feeds:

```sh
npm run check-feeds
```

| Feed | URL / coords | Notes |
| --- | --- | --- |
| Fox News (working) | `https://moxie.foxnews.com/google-publisher/latest.xml` | HTTP 200, RSS 2.0 with `media:content` photos |
| Fox News (not a feed) | `https://www.foxnews.com/about/rss` | HTML index, not used |
| Weather | Open-Meteo `34.98898, -90.01259` | Southaven, Mississippi. Timezone `America/Chicago` |
| History | Wikipedia `onthisday/selected/{MM}/{DD}` | Chicago calendar date |
| Verse | OurManna VOTD | Fallback: bible-api.com Psalm 118:24, then local copy |

## Phase 1 — kiosk shell

Still required under the dashboard: charcoal fullscreen, keep-awake, landscape, immersive-ish bars. Placeholder UI from Phase 1: [docs/phase-1-placeholder.png](./phase-1-placeholder.png).
