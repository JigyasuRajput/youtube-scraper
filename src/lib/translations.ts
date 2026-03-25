export type Locale = "ja" | "en";

export const translations = {
  ja: {
    title: "釣具レビュー分析",
    subtitle: "YouTube・ナチュラムからAIが官能評価を抽出・スコアリング",
    heroTitle: "YouTube・ナチュラムから\n官能評価を自動抽出",
    heroDescription:
      "製品名を入力するだけで、AIがYouTubeのレビュー動画とナチュラムの商品情報を分析し、グリップ感・振り心地・キャスティング性能などの感覚的評価を数値化します。",
    searchPlaceholder: "製品名を入力 (例: ダイワ エメラルダス ロッド)",
    searchButton: "分析開始",
    analyzing: "分析中...",
    aggregateTitle: "総合スコア",
    videoBreakdown: "ソース別分析",
    noResults:
      "レビュー動画が見つかりませんでした。別の検索語をお試しください。",
    errorMessage: "エラーが発生しました。もう一度お試しください。",
    dimensions: {
      gripFeel: "グリップ感",
      swingSensation: "振り心地",
      weightBalance: "重量バランス",
      castingPerformance: "キャスティング性能",
      durabilityImpression: "耐久性の印象",
      overallSatisfaction: "総合満足度",
    },
    summary: "要約",
    quotes: "引用",
    videoCount: "件のソースを分析",
    sourceLink: "YouTubeで見る",
    naturumLink: "ナチュラムで見る",
    poweredBy: "Groq AI による分析",
    language: "EN",
    features: {
      searchTitle: "マルチソース検索",
      searchDesc:
        "YouTube動画とナチュラムから商品情報を自動検索し、レビュー・説明文を取得します。",
      analysisTitle: "AI官能評価分析",
      analysisDesc:
        "AIが6つの感覚軸（グリップ感、振り心地、重量バランスなど）でスコアリングします。",
      reportTitle: "構造化レポート",
      reportDesc:
        "ソース別のスコア・引用・要約を一覧表示。総合スコアで全体像を把握できます。",
    },
    howItWorks: "仕組み",
    steps: {
      step1: "製品名を入力",
      step1Desc: "分析したい釣具の名前を入力",
      step2: "自動検索",
      step2Desc: "YouTube・ナチュラムから関連情報を取得",
      step3: "AIが分析",
      step3Desc: "コンテンツから官能評価を抽出",
      step4: "レポート生成",
      step4Desc: "スコア・引用・要約を構造化表示",
    },
    loading: {
      step1: "YouTube・ナチュラムで検索中...",
      step2: "ソースからコンテンツを抽出中...",
      step2With: "{n}件のソースからコンテンツを抽出中...",
      step3: "AIが官能評価を分析中...",
      step3With: "AIが官能評価を分析中... ({c}/{t})",
      label1: "検索",
      label2: "抽出",
      label3: "分析",
    },
  },
  en: {
    title: "Fishing Tackle Review Analyzer",
    subtitle: "AI extracts and scores organoleptic evaluations from YouTube & Naturum",
    heroTitle: "Extract Organoleptic Ratings\nfrom YouTube & Naturum",
    heroDescription:
      "Just enter a product name and AI will analyze YouTube reviews and Naturum product listings, scoring dimensions like grip feel, swing sensation, and casting performance.",
    searchPlaceholder:
      "Enter product name (e.g., Daiwa Emeraldas fishing rod)",
    searchButton: "Analyze",
    analyzing: "Analyzing...",
    aggregateTitle: "Aggregate Scores",
    videoBreakdown: "Per-Source Breakdown",
    noResults: "No review videos found. Try a different search term.",
    errorMessage: "An error occurred. Please try again.",
    dimensions: {
      gripFeel: "Grip Feel",
      swingSensation: "Swing Sensation",
      weightBalance: "Weight & Balance",
      castingPerformance: "Casting Performance",
      durabilityImpression: "Durability Impression",
      overallSatisfaction: "Overall Satisfaction",
    },
    summary: "Summary",
    quotes: "Quotes",
    videoCount: "sources analyzed",
    sourceLink: "Watch on YouTube",
    naturumLink: "View on Naturum",
    poweredBy: "Powered by Groq AI",
    language: "JA",
    features: {
      searchTitle: "Multi-Source Search",
      searchDesc:
        "Searches YouTube reviews and Naturum product listings, extracting transcripts, descriptions, and review data.",
      analysisTitle: "AI Organoleptic Analysis",
      analysisDesc:
        "AI scores 6 organoleptic dimensions: grip feel, swing sensation, weight balance, and more.",
      reportTitle: "Structured Reports",
      reportDesc:
        "View per-source scores, quotes, and summaries at a glance with aggregate scoring.",
    },
    howItWorks: "How It Works",
    steps: {
      step1: "Enter Product Name",
      step1Desc: "Type the fishing tackle you want analyzed",
      step2: "Auto-Search",
      step2Desc: "YouTube & Naturum content is fetched automatically",
      step3: "AI Analyzes",
      step3Desc: "Organoleptic evaluations extracted from content",
      step4: "View Report",
      step4Desc: "Structured scores, quotes, and summaries",
    },
    loading: {
      step1: "Searching YouTube & Naturum...",
      step2: "Extracting content from sources...",
      step2With: "Extracting content from {n} sources...",
      step3: "AI is analyzing organoleptic evaluations...",
      step3With: "AI is analyzing organoleptic evaluations... ({c}/{t})",
      label1: "Search",
      label2: "Extract",
      label3: "Analyze",
    },
  },
} as const;

export type Translations = (typeof translations)[Locale];
