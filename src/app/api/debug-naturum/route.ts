import { NextRequest } from "next/server";
import { searchNaturum } from "@/lib/naturum";
import { analyzeTranscripts, ContentInput } from "@/lib/analyzer";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") || "ダイワ エメラルダス";
  const start = Date.now();
  const logs: string[] = [];

  try {
    // Step 1: Scrape naturum
    const products = await searchNaturum(query, 1, "en", (event, data) => {
      logs.push(`${Date.now() - start}ms: ${event} ${JSON.stringify(data)}`);
    });

    if (products.length === 0) {
      return Response.json({ error: "No products found", logs });
    }

    // Step 2: Try analyzing ONE item with Groq
    const item = products[0];
    const content: ContentInput[] = [
      {
        videoId: item.itemCode,
        title: item.name,
        channelTitle: item.brand,
        url: item.url,
        transcript: `[Product Description]\n${item.description}\n\n[Specs]\n${item.specs}\n\n[Rating] ${item.rating}/5 (${item.reviewCount} reviews)`,
        source: "naturum" as const,
      },
    ];

    logs.push(`${Date.now() - start}ms: starting_groq_analysis`);

    const result = await analyzeTranscripts(content, query, "en", (event, data) => {
      logs.push(`${Date.now() - start}ms: ${event} ${JSON.stringify(data)}`);
    });

    return Response.json({
      duration: `${Date.now() - start}ms`,
      analysesCount: result.videoAnalyses.length,
      analyses: result.videoAnalyses,
      logs,
    });
  } catch (err) {
    return Response.json({
      duration: `${Date.now() - start}ms`,
      error: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
      logs,
    });
  }
}
