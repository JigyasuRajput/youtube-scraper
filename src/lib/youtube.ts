import { google } from "googleapis";

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

export interface VideoData {
  videoId: string;
  title: string;
  channelTitle: string;
  url: string;
  transcript: string;
}

export type ProgressCallback = (event: string, data: unknown) => void;

async function fetchTranscriptFromPage(videoId: string): Promise<string> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const response = await fetch(watchUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "ja,en;q=0.9",
    },
  });
  const html = await response.text();

  const captionsMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
  if (!captionsMatch) throw new Error("No captions found");

  const captionTracks = JSON.parse(captionsMatch[1]);
  const track =
    captionTracks.find(
      (t: { languageCode: string }) => t.languageCode === "ja"
    ) || captionTracks[0];

  if (!track?.baseUrl) throw new Error("No caption URL found");

  const transcriptResponse = await fetch(track.baseUrl + "&fmt=json3", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  const contentType = transcriptResponse.headers.get("content-type") || "";

  if (contentType.includes("json")) {
    const json = await transcriptResponse.json();
    const events = json.events || [];
    return events
      .filter((e: { segs?: unknown[] }) => e.segs)
      .map((e: { segs: { utf8: string }[] }) =>
        e.segs.map((s) => s.utf8).join("")
      )
      .join(" ")
      .trim();
  }

  const xml = await transcriptResponse.text();
  if (!xml) throw new Error("Empty transcript response");

  const textSegments: string[] = [];
  const regex = /<text[^>]*>(.*?)<\/text>/gs;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const text = match[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n/g, " ")
      .trim();
    if (text) textSegments.push(text);
  }
  return textSegments.join(" ");
}

async function fetchComments(videoId: string): Promise<string> {
  try {
    const response = await youtube.commentThreads.list({
      part: ["snippet"],
      videoId,
      maxResults: 50,
      order: "relevance",
    });

    const comments = (response.data.items || []).map(
      (item) =>
        item.snippet?.topLevelComment?.snippet?.textDisplay
          ?.replace(/<br\s*\/?>/g, " ")
          .replace(/<[^>]*>/g, "") || ""
    );

    return comments.filter((c) => c.length > 10).join("\n");
  } catch {
    return "";
  }
}

async function fetchVideoDescription(videoId: string): Promise<string> {
  try {
    const response = await youtube.videos.list({
      part: ["snippet"],
      id: [videoId],
    });

    return response.data.items?.[0]?.snippet?.description || "";
  } catch {
    return "";
  }
}

export async function searchAndExtract(
  query: string,
  maxResults: number = 5,
  locale: string = "ja",
  onProgress?: ProgressCallback
): Promise<VideoData[]> {
  onProgress?.("searching", { query });

  const isJapanese = locale === "ja";
  const searchResponse = await youtube.search.list({
    part: ["snippet"],
    q: isJapanese ? `${query} レビュー インプレ` : `${query} review`,
    type: ["video"],
    maxResults: maxResults + 3,
    ...(isJapanese && { relevanceLanguage: "ja" }),
  });

  const items = searchResponse.data.items || [];
  onProgress?.("search_done", { count: items.length });

  const videos: VideoData[] = [];

  for (const item of items) {
    if (videos.length >= maxResults) break;

    const videoId = item.id?.videoId;
    if (!videoId) continue;

    const title = item.snippet?.title || "Unknown";
    onProgress?.("extracting", {
      videoId,
      title,
      index: videos.length,
    });

    let content = "";
    let source = "transcript";

    try {
      content = await fetchTranscriptFromPage(videoId);
    } catch {
      // transcript failed
    }

    if (content.length < 50) {
      source = "comments";
      const [comments, description] = await Promise.all([
        fetchComments(videoId),
        fetchVideoDescription(videoId),
      ]);
      content = `[Video Description]\n${description}\n\n[Viewer Comments]\n${comments}`;
    }

    if (content.length < 50) {
      onProgress?.("extract_skip", { videoId, title });
      continue;
    }

    onProgress?.("extract_done", { videoId, title, source, length: content.length });

    videos.push({
      videoId,
      title,
      channelTitle: item.snippet?.channelTitle || "Unknown",
      url: `https://www.youtube.com/watch?v=${videoId}`,
      transcript:
        content.length > 4000 ? content.slice(0, 4000) : content,
    });
  }

  onProgress?.("extraction_complete", { count: videos.length });
  return videos;
}
