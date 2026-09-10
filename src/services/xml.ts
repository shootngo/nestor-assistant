export function decodeXmlEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&#(\d+);/g, (_, dec: string) => {
      const code = Number.parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

export function innerXml(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? decodeXmlEntities(match[1]) : null;
}

export function selfClosingAttr(block: string, tag: string, attr: string): string | null {
  const tagMatch = block.match(new RegExp(`<${tag}\\b([^>]*)\\/?>`, 'i'));
  if (!tagMatch) {
    return null;
  }
  const attrMatch =
    tagMatch[1].match(new RegExp(`\\b${attr}\\s*=\\s*"([^"]+)"`, 'i')) ??
    tagMatch[1].match(new RegExp(`\\b${attr}\\s*=\\s*'([^']+)'`, 'i'));
  return attrMatch ? decodeXmlEntities(attrMatch[1]) : null;
}
