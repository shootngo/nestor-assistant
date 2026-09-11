# Test notes

## Phase 4 — wake / sleep

Confirm on the Fire tablet after installing a rebuilt APK. Web preview can show the egg UI but **cannot** run on-device KWS (no Android mic module).

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
| `ALLOW_WAKE_SIMULATE` | `true` | Long-press the wordmark / listening egg to preview without speaking |

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
| Identity | No model name anywhere. Egg face never says Gemini / sherpa / Picovoice |
| Idle | Phase 3 dashboard still cycles (weather, Fox, history, verse, nest, rare hatch) |
| Mic prompt | First launch asks for the microphone. Deny → cream “mic needed” card. **Continue to the kitchen board** leaves the dashboard running |
| Wake | Say **Nestor** (or long-press the wordmark) → dashboard pauses → cream egg, slow blink, “Listening…”, “Say Goodbye Nestor to dismiss” |
| Sleep | Say **Goodbye Nestor** (or long-press the egg) → little legs, unhurried run off screen → dashboard resumes mid-loop |
| Silence | After ~5 minutes with no speech-level mic energy, same exit as Goodbye |
| Keep-awake | Screen stays on; landscape; immersive bars |
| Out of scope | No SpeechRecognizer Q&A, no Gemini, no TTS, no Firestore, no overnight dim |

### Expected Fire-tablet mic test (not runnable in CI)

This environment has no Fire tablet microphone. On the fridge tablet, after sideloading the Phase 4 APK:

1. Open **Nestor**, allow the microphone. If you deny it once, use **Try the microphone again** or Android app settings.
2. Let the dashboard cycle once so you can see weather / nest cards still work.
3. From across the kitchen, say **Nestor** in a normal voice. The egg should appear within about a second. The board should freeze (not keep flipping cards behind the egg).
4. Say **Goodbye Nestor**. The egg should grow little legs and walk off, then the board should continue.
5. Wake again, then stay quiet. After about five minutes the egg should leave on its own.
6. If **Nestor** alone fires on TV / talk radio, set `WAKE_PHRASE` to `hey_nestor` in `src/config.ts`, rebuild the APK, and use **Hey Nestor** instead. Do not start a new phase for that.

If the tablet never wakes on voice but long-press still shows the egg, the UI path is fine and the mic / KWS path needs a look (permission, `assets/kws` copy, or threshold).

### Web preview (UI only)

```
?session=listen
?session=exit
?session=exit&hold=1
?session=mic
?wakeTap=1
```

`npx expo start --web` then open those query strings at 1280×800. Long-press the **Nestor** wordmark to wake when `ALLOW_WAKE_SIMULATE` is true.

### Rebuild APK

After `npm install`:

- EAS: `npx eas-cli build -p android --profile preview`
- Local: `npx expo prebuild --platform android` then `cd android && ./gradlew assembleDebug`

Sideload with `adb install -r`. `expo-sherpa-onnx` and `nestor-mic` are native — Expo Go will not work.

`npx tsc --noEmit` should stay clean. `npm run check-feeds` should print `check-feeds: ok`.

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
