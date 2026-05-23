import { NextRequest, NextResponse } from "next/server";
import { scrapeBingImages } from "@/lib/bing-scraper";

export async function GET(request: NextRequest) {
  try {
    if (process.env.ENABLE_BING_IMAGE_SCRAPER !== "true") {
      return NextResponse.json({
        query: request.nextUrl.searchParams.get("q") || "",
        count: 0,
        images: [],
        disabled: true,
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const requestedCount = parseInt(searchParams.get("count") || "5", 10);
    const count = Number.isFinite(requestedCount)
      ? Math.min(Math.max(requestedCount, 1), 10)
      : 5;

    if (!query) {
      return NextResponse.json(
        { error: "Missing query parameter 'q'" },
        { status: 400 }
      );
    }

    console.log("[/api/scrape-images] Scraping for:", query);

    // Scrape Bing Images
    const images = await scrapeBingImages(query, count);

    return NextResponse.json({
      query,
      count: images.length,
      images,
    });
  } catch (error) {
    console.error("[/api/scrape-images] Error:", error);
    return NextResponse.json(
      { error: "Failed to scrape images", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
