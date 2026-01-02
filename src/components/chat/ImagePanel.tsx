"use client";

import { useEffect, useState, useRef, memo } from "react";
import { searchImages } from "@/lib/image-service";
import { ImageIcon } from "lucide-react";

interface DisplayedImage {
  id: string;
  keyword: string;
  type: string;
  url?: string;
  thumbnailUrl?: string;
  title: string;
  author?: string;
  authorUrl?: string;
  source: "bing-scraper";
  timestamp: number;
}

export function ImagePanel() {
  const [images, setImages] = useState<DisplayedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const processingKeywords = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Listen for image display events
    const handleImageRequest = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { keyword, type } = customEvent.detail;
      console.log("[ImagePanel] Received displayImage event:", { keyword, type });
      await addImageForKeyword(keyword, type);
    };

    window.addEventListener('displayImage', handleImageRequest);

    return () => {
      window.removeEventListener('displayImage', handleImageRequest);
    };
  }, []);

  // Auto-scroll to bottom when new images are added
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [images]);

  const addImageForKeyword = async (keyword: string, type: string) => {
    console.log("[ImagePanel] addImageForKeyword called:", { keyword, type });

    // Check if we're already processing this keyword
    if (processingKeywords.current.has(keyword)) {
      console.log("[ImagePanel] Keyword already processing:", keyword);
      console.log("[ImagePanel] Current processing keywords:", Array.from(processingKeywords.current));
      return; // Already processing
    }

    // Check if we already have an image for this keyword (from last 5 minutes)
    const existing = images.find(
      img => img.keyword === keyword && Date.now() - img.timestamp < 300000
    );

    if (existing) {
      console.log("[ImagePanel] Image already displayed recently:", keyword);
      return; // Already displayed recently
    }

    // Mark as processing
    processingKeywords.current.add(keyword);
    console.log("[ImagePanel] Marked as processing, current set:", Array.from(processingKeywords.current));

    setLoading(true);
    try {
      // Enhance search query with type-specific suffixes for better results
      let enhancedKeyword = keyword;

      // Don't add suffix if it already has one
      const hasSuffix = /景点|旅游|美食|小吃|照片|图片|风光|景点$/.test(keyword);

      if (!hasSuffix) {
        if (type === "attraction") {
          enhancedKeyword = `${keyword}景点`;
        } else if (type === "food") {
          enhancedKeyword = `${keyword}美食`;
        } else if (type === "location") {
          enhancedKeyword = `${keyword}风光`;
        }
      }

      console.log("[ImagePanel] Searching images for:", enhancedKeyword);
      const imageSources = await searchImages(enhancedKeyword, 1);
      console.log("[ImagePanel] Search results:", imageSources.length, "images");

      if (imageSources.length > 0) {
        const imgSource = imageSources[0];
        const newImage: DisplayedImage = {
          id: imgSource.id,
          keyword,
          type,
          url: imgSource.url,
          thumbnailUrl: imgSource.thumbnailUrl,
          title: imgSource.title,
          author: imgSource.author,
          authorUrl: imgSource.authorUrl,
          source: imgSource.source,
          timestamp: Date.now(),
        };

        console.log("[ImagePanel] Adding image from", newImage.source, ":", newImage);
        setImages(prev => [...prev.slice(-9), newImage]); // Keep only last 10 images
      } else {
        console.log("[ImagePanel] No images found for:", keyword);
        // No fallback - just log it
      }
    } catch (error) {
      console.error("[ImagePanel] Error fetching image:", error);
      console.error("[ImagePanel] Error details:", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
      // Remove from processing set
      processingKeywords.current.delete(keyword);
      console.log("[ImagePanel] Removed from processing, current set:", Array.from(processingKeywords.current));
    }
  };

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            相关图片
          </h2>
          <span className="text-xs text-slate-500">{images.length}</span>
        </div>
      </div>

      {/* Images Container */}
      <div
        ref={panelRef}
        className="flex-1 overflow-y-auto p-3 space-y-3"
      >
        {images.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ImageIcon className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              AI提到的景点和美食图片会在这里显示
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              随着对话进行自动更新
            </p>
          </div>
        )}

        {images.map((image) => (
          <div
            key={image.id}
            className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Image Card */}
            <>
              <div className="relative aspect-video bg-slate-100 dark:bg-slate-700">
                <img
                  src={image.thumbnailUrl || image.url}
                  alt={image.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onClick={() => window.open(image.url, '_blank')}
                  style={{ cursor: 'pointer' }}
                />
                {/* Source Badge */}
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 text-xs font-medium bg-black/50 backdrop-blur-sm text-white rounded-full">
                    {image.keyword}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                  {image.title}
                </p>

                {/* Author/Source */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {image.source === 'bing-scraper' ? '来自网络搜索' : image.author || '网络来源'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(image.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </>
          </div>
        ))}

        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        )}
      </div>
    </div>
  );
}

// Use memo to prevent unnecessary re-renders
export default memo(ImagePanel);
