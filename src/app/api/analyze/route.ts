import { NextRequest } from "next/server";
import { searchAndExtract } from "@/lib/youtube";
import { analyzeTranscripts } from "@/lib/analyzer";

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
        const videos = await searchAndExtract(query, 5, locale, (event, data) => {
          send(event, data);
        });

        if (videos.length === 0) {
          send("error", { code: "no_videos" });
          controller.close();
          return;
        }

        const result = await analyzeTranscripts(
          videos,
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
