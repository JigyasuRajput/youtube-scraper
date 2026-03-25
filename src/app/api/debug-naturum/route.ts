import { searchNaturum } from "@/lib/naturum";

export async function GET() {
  const start = Date.now();
  const logs: string[] = [];

  try {
    const results = await searchNaturum("ダイワ ロッド", 3, (event, data) => {
      logs.push(`${Date.now() - start}ms: ${event} ${JSON.stringify(data)}`);
    });

    return Response.json({
      duration: `${Date.now() - start}ms`,
      resultsCount: results.length,
      results: results.map((r) => ({
        name: r.name,
        brand: r.brand,
        descLength: r.description.length,
        rating: r.rating,
        url: r.url,
      })),
      logs,
    });
  } catch (err) {
    return Response.json({
      duration: `${Date.now() - start}ms`,
      error: err instanceof Error ? err.message : "Unknown error",
      logs,
    });
  }
}
