export interface ImageSource {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  author: string;
  authorUrl: string;
  source: "bing-scraper";
}

/**
 * Image search service using Bing Scraper (No API key needed!)
 */
export async function searchImages(
  query: string,
  count: number = 5
): Promise<ImageSource[]> {
  // Use Bing Scraper (No API key needed, best coverage for Chinese content!)
  try {
    const response = await fetch(`/api/scrape-images?q=${encodeURIComponent(query)}&count=${count}`);
    if (response.ok) {
      const data = await response.json();
      if (data.images && data.images.length > 0) {
        console.log("[ImageService] Using Bing Scraper results, found", data.images.length, "images");
        return data.images.map((img: any, index: number) => ({
          id: `bing-scraper-${Date.now()}-${index}`,
          url: img.url,
          thumbnailUrl: img.thumbnailUrl,
          title: img.title,
          author: "Bing搜索",
          authorUrl: img.sourceUrl,
          source: "bing-scraper" as const,
        }));
      }
    }
  } catch (error) {
    console.error("[ImageService] Bing Scraper failed:", error);
  }

  console.warn("[ImageService] No images found");
  return [];
}
