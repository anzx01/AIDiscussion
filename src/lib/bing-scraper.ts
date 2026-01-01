interface ScrapedImage {
  url: string;
  thumbnailUrl: string;
  title: string;
  sourceUrl: string;
}

/**
 * Scrape Bing Images search results
 * Note: For educational purposes only, may violate Bing's Terms of Service
 */
export async function scrapeBingImages(
  query: string,
  count: number = 5
): Promise<ScrapedImage[]> {
  try {
    console.log("[BingScraper] Scraping Bing Images for:", query);

    // Build the search URL - use the regular images search page
    const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&count=${count}&first=0&mmasync=1`;

    // Fetch the HTML
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'DNT': '1',
        'Connection': 'keep-alive',
      },
    });

    if (!response.ok) {
      console.error('[BingScraper] Failed to fetch:', response.status);
      return [];
    }

    const html = await response.text();
    console.log('[BingScraper] HTML length:', html.length);

    // Decode HTML entities
    const decodedHtml = html
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\\u0026/g, '&');

    const images: ScrapedImage[] = [];

    // Try multiple regex patterns to find image metadata
    // Pattern 1: Look for complete image metadata blocks
    const pattern1 = /\{"murl":"([^"]+)","turl":"([^"]+)","(?:pt|title)":"([^"]*)","purl":"([^"]+)"/g;

    let match = pattern1.exec(decodedHtml);
    while (match !== null && images.length < count) {
      try {
        const [, murl, turl, pt, purl] = match;
        images.push({
          url: decodeURIComponent(murl),
          thumbnailUrl: decodeURIComponent(turl),
          title: decodeURIComponent(pt || query),
          sourceUrl: decodeURIComponent(purl),
        });
      } catch (e) {
        console.error('[BingScraper] Failed to parse match:', e);
      }
      match = pattern1.exec(decodedHtml);
    }

    // Pattern 2: If pattern 1 didn't work, try simpler patterns
    if (images.length === 0) {
      console.log('[BingScraper] Trying alternative patterns');

      // Look for individual fields and try to correlate them
      const murlMatches = [...decodedHtml.matchAll(/"murl":"([^"]+)"/g)];
      const turlMatches = [...decodedHtml.matchAll(/"turl":"([^"]+)"/g)];
      const titleMatches = [...decodedHtml.matchAll(/"(?:pt|title)":"([^"]*)"/g)];
      const purlMatches = [...decodedHtml.matchAll(/"purl":"([^"]+)"/g)];

      const maxImages = Math.min(count, murlMatches.length, turlMatches.length, purlMatches.length);

      for (let i = 0; i < maxImages; i++) {
        try {
          images.push({
            url: decodeURIComponent(murlMatches[i][1]),
            thumbnailUrl: decodeURIComponent(turlMatches[i][1]),
            title: titleMatches[i] ? decodeURIComponent(titleMatches[i][1]) : query,
            sourceUrl: decodeURIComponent(purlMatches[i][1]),
          });
        } catch (e) {
          console.error('[BingScraper] Failed to parse alternative match:', e);
        }
      }
    }

    console.log(`[BingScraper] Successfully scraped ${images.length} images`);

    // Log a sample for debugging
    if (images.length > 0) {
      console.log('[BingScraper] Sample image:', images[0]);
    } else {
      console.log('[BingScraper] No images found. HTML preview:', decodedHtml.substring(0, 500));
    }

    return images;
  } catch (error) {
    console.error('[BingScraper] Scraping failed:', error);
    return [];
  }
}
