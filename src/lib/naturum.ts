export interface NaturumProduct {
  itemCode: string;
  name: string;
  brand: string;
  url: string;
  description: string;
  specs: string;
  rating: number;
  reviewCount: number;
}

export type ProgressCallback = (event: string, data: unknown) => void;

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchPage(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "ja,en;q=0.9",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!response.ok) return "";
    return response.text();
  } catch {
    return "";
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&yen;/g, "¥");
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractListItems(html: string, id: string): string[] {
  const regex = new RegExp(`id="${id}"[^>]*>([\\s\\S]*?)</ul>`, "i");
  const match = html.match(regex);
  if (!match) return [];

  const items: string[] = [];
  const liRegex = /<li>([\s\S]*?)<\/li>/gi;
  let liMatch;
  while ((liMatch = liRegex.exec(match[1])) !== null) {
    const text = stripHtml(decodeHtmlEntities(liMatch[1])).trim();
    if (text) items.push(text);
  }
  return items;
}

function extractJsonLd(html: string): {
  name: string;
  brand: string;
  rating: number;
  reviewCount: number;
} {
  const result = { name: "", brand: "", rating: 0, reviewCount: 0 };
  const regex =
    /<script type="application\/ld\+json">\s*(\{[\s\S]*?"@type"\s*:\s*"Product"[\s\S]*?\})\s*<\/script>/i;
  const match = html.match(regex);
  if (!match) return result;

  try {
    const data = JSON.parse(match[1]);
    result.name = data.name || "";
    result.brand = data.brand?.name || "";
    if (data.aggregateRating) {
      result.rating = parseFloat(data.aggregateRating.ratingValue) || 0;
      result.reviewCount =
        parseInt(data.aggregateRating.reviewCount, 10) || 0;
    }
  } catch {
    // ignore parse errors
  }
  return result;
}

export async function searchNaturum(
  query: string,
  maxResults: number = 3,
  onProgress?: ProgressCallback
): Promise<NaturumProduct[]> {
  try {
  onProgress?.("naturum_searching", { query });

  const encoded = encodeURIComponent(query);
  const searchUrl = `https://www.naturum.co.jp/search/?keyword=${encoded}&sort=review`;
  const searchHtml = await fetchPage(searchUrl);

  if (!searchHtml) {
    onProgress?.("naturum_error", { error: "Search page returned empty" });
    return [];
  }

  // Extract item codes from search results
  const itemRegex = /itemcd=(\d+)/g;
  const seenItems = new Set<string>();
  const itemCodes: string[] = [];
  let match;
  while ((match = itemRegex.exec(searchHtml)) !== null) {
    if (!seenItems.has(match[1])) {
      seenItems.add(match[1]);
      itemCodes.push(match[1]);
    }
    if (itemCodes.length >= maxResults + 3) break;
  }

  onProgress?.("naturum_search_done", { count: itemCodes.length });

  const results: NaturumProduct[] = [];

  for (const itemCode of itemCodes) {
    if (results.length >= maxResults) break;

    const productUrl = `https://www.naturum.co.jp/product/?itemcd=${itemCode}&categoryid=0`;
    const html = await fetchPage(productUrl);
    if (!html) continue;

    const jsonLd = extractJsonLd(html);
    const description = extractListItems(html, "itemDescription");
    const specs = extractListItems(html, "itemSpec");

    const content = [
      ...description.map((d) => `- ${d}`),
      ...specs.map((s) => `- ${s}`),
    ].join("\n");

    if (content.length < 30) continue;

    onProgress?.("naturum_item", {
      index: results.length,
      title: jsonLd.name || `Product ${itemCode}`,
    });

    results.push({
      itemCode,
      name: jsonLd.name || `Product ${itemCode}`,
      brand: jsonLd.brand || "Unknown",
      url: productUrl,
      description: content.length > 8000 ? content.slice(0, 8000) : content,
      specs: specs.join(" | "),
      rating: jsonLd.rating,
      reviewCount: jsonLd.reviewCount,
    });
  }

  onProgress?.("naturum_complete", { count: results.length });
  return results;
  } catch (err) {
    onProgress?.("naturum_error", {
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return [];
  }
}
