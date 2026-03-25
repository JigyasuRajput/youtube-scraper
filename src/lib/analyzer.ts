import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  });

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];

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

    const prompt = isJapanese
      ? `あなたは釣具の専門レビューアナリストです。以下の${sourceLabel}のコンテンツを分析し、「${query}」に関する官能評価を抽出してください。

重要: すべての出力（quotes、summary）は必ず日本語で記述してください。元のコンテンツが他の言語の場合は、日本語に翻訳してください。

コンテンツ:
${video.transcript}

以下の各項目について1〜10のスコアで評価してください（コンテンツに該当する情報がない場合は5としてください）:
1. グリップ感 (質感、快適さ、素材の品質)
2. 振り心地 (バランス、レスポンス、しなり)
3. 重量バランス (軽さ、重量配分)
4. キャスティング性能 (飛距離、精度、スムーズさ)
5. 耐久性の印象 (作りの良さ、堅牢性)
6. 総合満足度

また、コンテンツから具体的な記述を日本語で3つまで引用（または翻訳して引用）し、全体の要約を日本語で2〜3文で記述してください。

以下のJSON形式で回答してください:
{
  "scores": {
    "gripFeel": <number>,
    "swingSensation": <number>,
    "weightBalance": <number>,
    "castingPerformance": <number>,
    "durabilityImpression": <number>,
    "overallSatisfaction": <number>
  },
  "quotes": ["日本語の引用1", "日本語の引用2", "日本語の引用3"],
  "summary": "日本語の要約文"
}`
      : `You are an expert fishing tackle review analyst. Analyze the following ${sourceLabel} content and extract organoleptic evaluations for "${query}".

IMPORTANT: All output (quotes, summary) must be in English. If the source content is in another language, translate to English.

Content:
${video.transcript}

Score each dimension from 1-10 (use 5 if no relevant information is found):
1. Grip Feel (texture, comfort, material quality)
2. Swing Sensation (balance, responsiveness, flex)
3. Weight & Balance (lightness, distribution)
4. Casting Performance (distance, accuracy, smoothness)
5. Durability Impression (build quality, robustness)
6. Overall Satisfaction

Also extract up to 3 specific reviewer quotes (translated to English if needed) and write a 2-3 sentence summary in English.

Respond in the following JSON format:
{
  "scores": {
    "gripFeel": <number>,
    "swingSensation": <number>,
    "weightBalance": <number>,
    "castingPerformance": <number>,
    "durabilityImpression": <number>,
    "overallSatisfaction": <number>
  },
  "quotes": ["English quote 1", "English quote 2", "English quote 3"],
  "summary": "English summary text"
}`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
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
