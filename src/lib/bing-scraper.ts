interface ScrapedImage {
  url: string;
  thumbnailUrl: string;
  title: string;
  sourceUrl: string;
}

// User-Agent pool for rotation
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
];

// Request cache to avoid duplicate requests
const requestCache = new Map<string, { data: ScrapedImage[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Rate limiting: track last request time
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

// Random delay range (ms)
const MIN_DELAY = 1000;
const MAX_DELAY = 3000;

/**
 * Get a random User-Agent from the pool
 */
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Add random delay to avoid detection
 */
function randomDelay(): Promise<void> {
  const delay = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Rate limiting check
 */
async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`[BingScraper] Rate limiting: waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}

/**
 * Check cache before making request
 */
function getCachedResults(query: string): ScrapedImage[] | null {
  const cached = requestCache.get(query);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('[BingScraper] Using cached results for:', query);
    return cached.data;
  }
  return null;
}

/**
 * Cache results
 */
function setCachedResults(query: string, data: ScrapedImage[]): void {
  requestCache.set(query, { data, timestamp: Date.now() });

  // Clean old cache entries
  const now = Date.now();
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      requestCache.delete(key);
    }
  }
}

/**
 * Scrape Bing Images search results with anti-scraping protections
 * Note: For educational purposes only, may violate Bing's Terms of Service
 */
export async function scrapeBingImages(
  query: string,
  count: number = 5
): Promise<ScrapedImage[]> {
  try {
    // Check cache first
    const cached = getCachedResults(query);
    if (cached) {
      return cached;
    }

    console.log("[BingScraper] Scraping Bing Images for:", query);

    // Enforce rate limiting
    await enforceRateLimit();

    // Add random delay
    await randomDelay();

    // Build the search URL - use the regular images search page
    const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&count=${count}&first=0&mmasync=1`;

    // Fetch the HTML with randomized headers
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
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

    // Cache the results
    if (images.length > 0) {
      setCachedResults(query, images);
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
