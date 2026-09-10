# Test notes

## Phase 2 — idle dashboard

Confirm on the Fire tablet (or an Android emulator / landscape web preview) after installing a rebuilt APK.

### Feeds used (checked at build time)

```sh
npm run check-feeds
```

| Feed | URL / coords | Notes |
| --- | --- | --- |
| Fox News (working) | `https://moxie.foxnews.com/google-publisher/latest.xml` | HTTP 200, RSS 2.0 with `media:content` photos. This is the feed the app uses first. |
| Fox News (not a feed) | `https://www.foxnews.com/about/rss` | 301 → `https://www.foxnews.com/story/foxnews-com-rss-feeds` (HTML index). |
| Fox News (fallbacks) | `…/us.xml`, `…/politics.xml` on `moxie.foxnews.com` | Used only if `latest.xml` 404s or has no items. |
| Weather | Open-Meteo `34.98898, -90.01259` | Southaven, Mississippi (De Soto). Timezone `America/Chicago`. Current + daily high/low. User-approx 34.99°N, 90.00°W. |
| History | `https://en.wikipedia.org/api/rest_v1/feed/onthisday/selected/{MM}/{DD}` | Chicago calendar date. Free REST, `Api-User-Agent` set. |
| Verse | `https://beta.ourmanna.com/api/v1/get?format=json` | OurManna verse of the day (NIV). Fallback: `https://bible-api.com/Psalm+118:24`, then a local Psalm 118:24. |

### App checks

| Check | Expected |
| --- | --- |
| Launcher name | **Nestor** |
| Identity | Corner wordmark **Nestor**. No model name anywhere |
| First loop | Weather (Southaven, current + high/low) → Fox headline (photo when present, label “Fox News”) → history and more headlines → verse of the day |
| Dwell | About 10 seconds per card; tap advances early; soft fade |
| Errors | Calm “Couldn’t load …” card; loop continues; app does not crash |
| Orientation | Landscape preferred |
| Sleep | Screen stays on while the app is in the foreground (tablet should stay plugged in) |
| System UI | Status / navigation bars hidden or overlay-swipe (Fire OS may still show a thin bar) |
| Out of scope | No mic, wake word, TTS, egg animation, hatch showpiece, overnight dim, Gemini, Firebase |

### Rebuild APK

Same path as Phase 1. After `npm install`:

- EAS: `npx eas-cli build -p android --profile preview`
- Local: `npx expo prebuild --platform android` then `cd android && ./gradlew assembleDebug`

Sideload with `adb install -r`.

`npx tsc --noEmit` should stay clean. `npm run check-feeds` should print `check-feeds: ok`.

Verified in this Phase 2 change: `npx tsc --noEmit` is clean; `npm run check-feeds` uses Fox `latest.xml` (25 items, all with photos), Open-Meteo Southaven **34.98898, -90.01259** (current + high/low), Wikipedia `selected/09/10`, and OurManna VOTD (1 John 4:10). Landscape web preview at 1280×800 showed weather, Fox News with photo, On This Day, and the verse card, with tap-to-advance and the Nestor wordmark. Open-Meteo is fetched without a custom `Api-User-Agent` header so browser CORS preflight does not block weather.

### Web preview (optional)

`npx expo start --web` is only for a quick look at the cards. It is not the fridge install path. Keep-awake and immersive bars apply on Android.

## Phase 1 — kiosk shell

Still required under the dashboard: charcoal fullscreen, keep-awake, landscape, immersive-ish bars. Placeholder UI from Phase 1: [docs/phase-1-placeholder.png](./phase-1-placeholder.png).
