import { FOX_NEWS_SOURCE_LABEL, FOX_RSS_CANDIDATES, MAX_NEWS_CARDS } from '../config';
import type { NewsCardData } from '../types';
import { fetchText } from './http';
import { innerXml, selfClosingAttr } from './xml';

export type FoxFeedResult = {
  feedUrl: string;
  items: NewsCardData[];
};

function parseItems(xml: string, feedUrl: string): NewsCardData[] {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  const items: NewsCardData[] = [];

  for (const [index, block] of blocks.entries()) {
    const title = innerXml(block, 'title');
    if (!title) {
      continue;
    }

    const guid = innerXml(block, 'guid');
    const link = innerXml(block, 'link');
    const imageUrl =
      selfClosingAttr(block, 'media:content', 'url') ??
      selfClosingAttr(block, 'enclosure', 'url') ??
      selfClosingAttr(block, 'media:thumbnail', 'url');

    items.push({
      kind: 'news',
      id: `news-${guid ?? link ?? `${feedUrl}-${index}`}`,
      title,
      imageUrl: imageUrl && /^https?:\/\//i.test(imageUrl) ? imageUrl : null,
      source: FOX_NEWS_SOURCE_LABEL,
    });
  }

  return items;
}

export async function fetchFoxHeadlines(): Promise<FoxFeedResult> {
  let lastError: unknown;

  for (const feedUrl of FOX_RSS_CANDIDATES) {
    try {
      const xml = await fetchText(feedUrl);
      const items = parseItems(xml, feedUrl).slice(0, MAX_NEWS_CARDS);
      if (items.length > 0) {
        return { feedUrl, items };
      }
      lastError = new Error(`No headlines in ${feedUrl}`);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Fox News RSS unavailable');
}
