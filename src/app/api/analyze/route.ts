import { NextRequest } from "next/server";
import { searchAndExtract } from "@/lib/youtube";
import { searchNaturum } from "@/lib/naturum";
import { analyzeTranscripts, ContentInput } from "@/lib/analyzer";

export async function POST(request: NextRequest) {
  const { query, locale = "ja" } = await request.json();

  if (!query || typeof query !== "string") {
    return new Response(JSON.stringify({ error: "Query is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ event, data })}\n\n`)
        );
      }

      try {
        // Fetch from YouTube and Naturum in parallel
        const [youtubeVideos, naturumProducts] = await Promise.all([
          searchAndExtract(query, 5, locale, (event, data) => {
            send(event, data);
          }),
          searchNaturum(query, 3, locale, (event, data) => {
            send(event, data);
          }),
        ]);

        // Normalize all content into a unified format
        const allContent: ContentInput[] = [
          ...youtubeVideos.map((v) => ({
            videoId: v.videoId,
            title: v.title,
            channelTitle: v.channelTitle,
            url: v.url,
            transcript: v.transcript,
            source: "youtube" as const,
          })),
          ...naturumProducts.map((item) => ({
            videoId: item.itemCode,
            title: item.name,
            channelTitle: item.brand,
            url: item.url,
            transcript: `[Product Description]\n${item.description}\n\n[Specs]\n${item.specs}\n\n[Rating] ${item.rating}/5 (${item.reviewCount} reviews)`,
            source: "naturum" as const,
          })),
        ];

        if (allContent.length === 0) {
          send("error", { code: "no_videos" });
          controller.close();
          return;
        }

        send("sources_ready", {
          youtube: youtubeVideos.length,
          naturum: naturumProducts.length,
          total: allContent.length,
        });

        const result = await analyzeTranscripts(
          allContent,
          query,
          locale,
          (event, data) => {
            send(event, data);
          }
        );

        send("complete", result);
      } catch (error) {
        console.error("Analysis error:", error);
        send("error", {
          code: "server_error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
