import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface SensoryScores {
  gripFeel: number;
  swingSensation: number;
  weightBalance: number;
  castingPerformance: number;
  durabilityImpression: number;
  overallSatisfaction: number;
}

export type SourceType = "youtube" | "naturum";

export interface VideoAnalysis {
  videoId: string;
  title: string;
  channelTitle: string;
  url: string;
  source: SourceType;
  scores: SensoryScores;
  quotes: string[];
  summary: string;
}

export interface AnalysisResult {
  query: string;
  videoAnalyses: VideoAnalysis[];
  aggregateScores: SensoryScores;
}

export interface ContentInput {
  videoId: string;
  title: string;
  channelTitle: string;
  url: string;
  transcript: string;
  source: SourceType;
}

export type ProgressCallback = (event: string, data: unknown) => void;

export async function analyzeTranscripts(
  videos: ContentInput[],
  query: string,
  locale: string,
  onProgress?: ProgressCallback
): Promise<AnalysisResult> {
  const isJapanese = locale === "ja";
  const videoAnalyses: VideoAnalysis[] = [];

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];

    // 2 second delay between calls to stay within Groq's 6K tokens/min limit
    if (i > 0) await new Promise((r) => setTimeout(r, 2000));

    onProgress?.("analyzing_video", {
      index: i,
      total: videos.length,
      title: video.title,
    });

    const sourceLabel =
      video.source === "naturum"
        ? isJapanese
          ? "ナチュラムの商品情報"
          : "Naturum product listing"
        : isJapanese
          ? "YouTubeレビュー動画"
          : "YouTube review video";

    // Truncate content to ~2000 chars to save token budget
    const content =
      video.transcript.length > 2000
        ? video.transcript.slice(0, 2000)
        : video.transcript;

    const prompt = isJapanese
      ? `あなたは釣具の専門レビューアナリストです。以下の${sourceLabel}のコンテンツを分析し、「${query}」に関する官能評価を抽出してください。

重要: すべての出力（quotes、summary）は必ず日本語で記述してください。

コンテンツ:
${content}

1〜10のスコアで評価してください（情報がない場合は5）:
1. グリップ感 2. 振り心地 3. 重量バランス 4. キャスティング性能 5. 耐久性の印象 6. 総合満足度

具体的な引用を3つまで、要約を2文で記述してください。

JSON形式で回答:
{"scores":{"gripFeel":0,"swingSensation":0,"weightBalance":0,"castingPerformance":0,"durabilityImpression":0,"overallSatisfaction":0},"quotes":[],"summary":""}`
      : `You are an expert fishing tackle review analyst. Analyze the following ${sourceLabel} content and extract organoleptic evaluations for "${query}".

Content:
${content}

Score 1-10 (use 5 if no info): Grip Feel, Swing Sensation, Weight & Balance, Casting Performance, Durability Impression, Overall Satisfaction.
Extract up to 3 quotes and a 2 sentence summary in English.

JSON format:
{"scores":{"gripFeel":0,"swingSensation":0,"weightBalance":0,"castingPerformance":0,"durabilityImpression":0,"overallSatisfaction":0},"quotes":[],"summary":""}`;

    try {
      const response = await client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 512,
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const text = response.choices[0]?.message?.content || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        onProgress?.("video_error", {
          index: i,
          title: video.title,
          error: "Invalid AI response",
        });
        continue;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const analysis: VideoAnalysis = {
        videoId: video.videoId,
        title: video.title,
        channelTitle: video.channelTitle,
        url: video.url,
        source: video.source,
        scores: parsed.scores,
        quotes: parsed.quotes || [],
        summary: parsed.summary || "",
      };

      videoAnalyses.push(analysis);

      onProgress?.("video_done", {
        index: i,
        title: video.title,
        analysis,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error(`Analysis error for "${video.title}":`, msg);
      onProgress?.("video_error", {
        index: i,
        title: video.title,
        error: msg,
      });
      continue;
    }
  }

  const aggregateScores = calculateAggregate(
    videoAnalyses.map((v) => v.scores)
  );

  return { query, videoAnalyses, aggregateScores };
}

function calculateAggregate(allScores: SensoryScores[]): SensoryScores {
  if (allScores.length === 0) {
    return {
      gripFeel: 0,
      swingSensation: 0,
      weightBalance: 0,
      castingPerformance: 0,
      durabilityImpression: 0,
      overallSatisfaction: 0,
    };
  }

  const keys: (keyof SensoryScores)[] = [
    "gripFeel",
    "swingSensation",
    "weightBalance",
    "castingPerformance",
    "durabilityImpression",
    "overallSatisfaction",
  ];

  const result = {} as SensoryScores;
  for (const key of keys) {
    const sum = allScores.reduce((acc, s) => acc + (s[key] || 0), 0);
    result[key] = Math.round((sum / allScores.length) * 10) / 10;
  }

  return result;
}
