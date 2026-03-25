export async function GET() {
  const url =
    "https://www.naturum.co.jp/search/?keyword=%E3%83%80%E3%82%A4%E3%83%AF+%E3%83%AD%E3%83%83%E3%83%89&sort=review";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ja,en-US;q=0.7,en;q=0.3",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Upgrade-Insecure-Requests": "1",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const text = await response.text();
    const itemMatches = text.match(/itemcd=(\d+)/g) || [];
    const uniqueItems = [...new Set(itemMatches)];

    return Response.json({
      status: response.status,
      statusText: response.statusText,
      contentLength: text.length,
      itemsFound: uniqueItems.length,
      firstItems: uniqueItems.slice(0, 5),
      htmlSnippet: text.slice(0, 500),
    });
  } catch (err) {
    return Response.json({
      error: err instanceof Error ? err.message : "Unknown error",
      errorType: err instanceof Error ? err.constructor.name : typeof err,
    });
  }
}
