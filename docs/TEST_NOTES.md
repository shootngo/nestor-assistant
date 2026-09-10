# Test notes

## Phase 3 — branding + hatch

Confirm on the Fire tablet (or an Android emulator / landscape web preview) after installing a rebuilt APK.

### Config knobs

In `src/config.ts`:

| Knob | Default | Notes |
| --- | --- | --- |
| `CARD_INTERVAL_MS` | 10000 | Ordinary cards, including simple branding |
| `BRANDING_SHOWPIECE_EVERY` | **10** | Hatch on the 10th, 20th, … branding pass. Try `5` or `20` if the fridge wants it more or less often |
| `BRANDING_SHOWPIECE_MS` | 18000 | Showpiece dwell |

Web preview overrides (not used on the APK):

```
?start=branding
?start=showpiece
?showpieceEvery=1
?showpieceFrame=nest
?showpieceFrame=egg
?showpieceFrame=hatch
?showpieceFrame=house
```

### App checks

| Check | Expected |
| --- | --- |
| Launcher name | **Nestor** |
| Identity | Corner wordmark **Nestor** on ordinary cards. No model name anywhere |
| Loop | Weather → branding still → news/history → branding still → … → verse |
| Simple branding | House in the nest + a short line (`Nestor here`, `Nestor ready for business`, …). Tasteful, silent |
| Showpiece | Every 10th branding slot: nest appears, egg appears, egg hatches, house inside, then **Hi, I'm Nestor, your personal assistant**. No TTS |
| Wordmark | Hidden during the full-screen showpiece |
| Dwell | ~10s ordinary cards; ~18s showpiece; tap advances early; soft fade |
| Errors | Calm “Couldn’t load …” card; loop continues; app does not crash |
| Orientation | Landscape preferred |
| Sleep | Screen stays on while the app is in the foreground (tablet should stay plugged in) |
| Out of scope | No mic, wake word, TTS, Gemini, Firebase, listening/talking egg, overnight dim |

### Rebuild APK

Same path as Phase 1–2. After `npm install`:

- EAS: `npx eas-cli build -p android --profile preview`
- Local: `npx expo prebuild --platform android` then `cd android && ./gradlew assembleDebug`

Sideload with `adb install -r`.

`npx tsc --noEmit` should stay clean. `npm run check-feeds` should print `check-feeds: ok`.

### Web preview (optional)

`npx expo start --web` is only for a quick look at the cards. It is not the fridge install path.

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
