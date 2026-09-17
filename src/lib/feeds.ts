// ============================================================
// ShipPulse  -  RSS / Atom Feed Generator
// Valid RSS 2.0 and Atom 1.0 feeds for public changelogs
// ============================================================

export interface FeedItem {
  id: string
  title: string
  summary: string
  content: string
  url: string
  publishedAt: string
  category?: string
  author?: string
}

export interface FeedConfig {
  title: string
  description: string
  url: string           // canonical URL of the changelog
  feedUrl: string       // URL of this feed itself
  language: string
  logoUrl?: string
  items: FeedItem[]
}

/**
 * Generate a valid RSS 2.0 feed.
 */
export function generateRSSFeed(config: FeedConfig): string {
  const { title, description, url, feedUrl, language, items } = config

  const escapeXML = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')

  const itemsXML = items
    .map(
      (item) => `
  <item>
    <title>${escapeXML(item.title)}</title>
    <description><![CDATA[${item.summary}]]></description>
    <content:encoded><![CDATA[${item.content}]]></content:encoded>
    <link>${escapeXML(item.url)}</link>
    <guid isPermaLink="true">${escapeXML(item.url)}</guid>
    <pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>
    ${item.category ? `<category>${escapeXML(item.category)}</category>` : ''}
    ${item.author ? `<author>${escapeXML(item.author)}</author>` : ''}
  </item>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXML(title)}</title>
    <description>${escapeXML(description)}</description>
    <link>${escapeXML(url)}</link>
    <language>${escapeXML(language)}</language>
    <atom:link href="${escapeXML(feedUrl)}" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>ShipPulse</generator>
    ${config.logoUrl ? `<image><url>${escapeXML(config.logoUrl)}</url><title>${escapeXML(title)}</title><link>${escapeXML(url)}</link></image>` : ''}
    ${itemsXML}
  </channel>
</rss>`
}

/**
 * Generate a valid Atom 1.0 feed.
 */
export function generateAtomFeed(config: FeedConfig): string {
  const { title, description, url, feedUrl, language, items } = config

  const escapeXML = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

  const entriesXML = items
    .map(
      (item) => `
  <entry>
    <id>${escapeXML(item.url)}</id>
    <title type="text">${escapeXML(item.title)}</title>
    <summary type="text">${escapeXML(item.summary)}</summary>
    <content type="html"><![CDATA[${item.content}]]></content>
    <link rel="alternate" href="${escapeXML(item.url)}"/>
    <published>${new Date(item.publishedAt).toISOString()}</published>
    <updated>${new Date(item.publishedAt).toISOString()}</updated>
    ${item.category ? `<category term="${escapeXML(item.category)}"/>` : ''}
  </entry>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${escapeXML(language)}">
  <id>${escapeXML(url)}</id>
  <title type="text">${escapeXML(title)}</title>
  <subtitle type="text">${escapeXML(description)}</subtitle>
  <link rel="alternate" href="${escapeXML(url)}"/>
  <link rel="self" href="${escapeXML(feedUrl)}"/>
  <updated>${new Date().toISOString()}</updated>
  <generator uri="https://ship-pulse.vercel.app">ShipPulse</generator>
  ${entriesXML}
</feed>`
}
