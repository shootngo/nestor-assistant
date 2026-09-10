/**
 * Build-time check for Phase 2 free feeds.
 * Confirms Fox RSS (and documents that about/rss is not a feed),
 * Open-Meteo Southaven weather, Wikipedia On This Day, and OurManna VOTD.
 */
const FOX_HTML_INDEX = 'https://www.foxnews.com/about/rss';
const FOX_CANDIDATES = [
  'https://moxie.foxnews.com/google-publisher/latest.xml',
  'https://moxie.foxnews.com/google-publisher/us.xml',
  'https://moxie.foxnews.com/google-publisher/politics.xml',
];
const USER_AGENT =
  'NestorAssistant/1.1 (https://github.com/shootngo/nestor-assistant; kitchen kiosk)';

async function status(url, headers = {}) {
  const response = await fetch(url, { headers, redirect: 'follow' });
  return { url, finalUrl: response.url, ok: response.ok, status: response.status, type: response.headers.get('content-type') };
}

async function main() {
  const notes = [];

  const about = await status(FOX_HTML_INDEX);
  notes.push(
    `foxnews.com/about/rss → HTTP ${about.status} (${about.finalUrl}); content-type ${about.type}. Not an RSS document — it is the public RSS index page.`,
  );

  let chosenFox = null;
  for (const url of FOX_CANDIDATES) {
    const result = await status(url);
    const body = result.ok ? await (await fetch(url)).text() : '';
    const items = (body.match(/<item\b/gi) || []).length;
    const photos = (body.match(/<media:content\b/gi) || []).length;
    notes.push(`${url} → HTTP ${result.status}, items=${items}, media:content=${photos}`);
    if (!chosenFox && result.ok && items > 0) {
      chosenFox = url;
    }
  }
  if (!chosenFox) {
    throw new Error('No working Fox News RSS feed');
  }
  notes.push(`Using Fox feed: ${chosenFox}`);

  const weatherUrl =
    'https://api.open-meteo.com/v1/forecast?latitude=34.98898&longitude=-90.01259&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=America/Chicago&forecast_days=1';
  const weather = await fetch(weatherUrl).then((r) => r.json());
  notes.push(
    `Open-Meteo Southaven 34.98898,-90.01259 → current ${weather.current?.temperature_2m} F, high ${weather.daily?.temperature_2m_max?.[0]}, low ${weather.daily?.temperature_2m_min?.[0]}`,
  );

  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const month = parts.find((p) => p.type === 'month').value;
  const day = parts.find((p) => p.type === 'day').value;
  const wiki = await fetch(
    `https://en.wikipedia.org/api/rest_v1/feed/onthisday/selected/${month}/${day}`,
    { headers: { 'Api-User-Agent': USER_AGENT } },
  );
  const wikiJson = await wiki.json();
  notes.push(
    `Wikipedia On This Day selected/${month}/${day} → HTTP ${wiki.status}, selected=${(wikiJson.selected || []).length}`,
  );

  const votd = await fetch('https://beta.ourmanna.com/api/v1/get?format=json');
  const votdJson = await votd.json();
  notes.push(
    `OurManna VOTD → HTTP ${votd.status}, ${votdJson.verse?.details?.reference ?? 'no reference'}`,
  );

  for (const line of notes) {
    console.log(line);
  }
  console.log('check-feeds: ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
