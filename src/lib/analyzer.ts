import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

// Try Groq first, fall back to Gemini on rate limit
async function callAI(prompt: string): Promise<string> {
  // Try Groq first (free, fast)
  try {
    const response = await groqClient.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 512,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });
    return response.choices[0]?.message?.content || "";
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    const isRateLimit = msg.includes("rate") || msg.includes("429") || msg.includes("limit");
    if (!isRateLimit) throw err;
  }

  // Fallback: Gemini (paid, but reliable)
  console.log("Groq rate limited, falling back to Gemini");
  const model = geminiClient.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 400,
      responseMimeType: "application/json",
    },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

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

    if (i > 0) await new Promise((r) => setTimeout(r, 1000));

    onProgress?.("analyzing_video", {
      index: i,
      total: videos.length,
      title: video.title,
    });

    const sourceLabel =
      video.source === "naturum"
        ? isJapanese ? "ナチュラムの商品情報" : "Naturum product listing"
        : isJapanese ? "YouTubeレビュー動画" : "YouTube review video";

    // Truncate to save tokens
    const content = video.transcript.length > 2000
      ? video.transcript.slice(0, 2000)
      : video.transcript;

    const prompt = isJapanese
      ? `釣具レビュー分析。${sourceLabel}から「${query}」の官能評価を抽出。

${content}

1-10でスコア（情報なし=5）: gripFeel,swingSensation,weightBalance,castingPerformance,durabilityImpression,overallSatisfaction
引用3つ、要約2文。レビューなしなら「カスタマーレビューはまだありません。スコアは商品仕様に基づいています。」
JSON: {"scores":{...},"quotes":[...],"summary":"..."}`
      : `Fishing tackle review analysis. Extract organoleptic scores for "${query}" from this ${sourceLabel}.

${content}

Score 1-10 (5 if no info): gripFeel,swingSensation,weightBalance,castingPerformance,durabilityImpression,overallSatisfaction
3 quotes, 2-sentence summary. If no reviews: "No customer reviews available. Scores based on product specs."
JSON: {"scores":{...},"quotes":[...],"summary":"..."}`;

    try {
      const text = await callAI(prompt);
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
      // Normalize quotes — AI sometimes returns objects like {text, author} instead of strings
      const rawQuotes: unknown[] = parsed.quotes || [];
      const quotes: string[] = rawQuotes.map((q) =>
        typeof q === "string" ? q : typeof q === "object" && q !== null && "text" in q ? String((q as { text: string }).text) : String(q)
      );
      const analysis: VideoAnalysis = {
        videoId: video.videoId,
        title: video.title,
        channelTitle: video.channelTitle,
        url: video.url,
        source: video.source,
        scores: parsed.scores,
        quotes,
        summary: typeof parsed.summary === "string" ? parsed.summary : String(parsed.summary || ""),
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
