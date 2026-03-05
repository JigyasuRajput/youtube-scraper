"use client";

import { useState, useRef } from "react";
import { useLanguage } from "@/lib/language-context";
import { LanguageToggle } from "@/components/language-toggle";
import { SearchForm } from "@/components/search-form";
import { AggregateReport } from "@/components/aggregate-report";
import { ReportCard } from "@/components/report-card";
import { LoadingScreen } from "@/components/loading-screen";
import { Card, CardContent } from "@/components/ui/card";
import type { AnalysisResult } from "@/lib/analyzer";

type LoadingPhase = "searching" | "extracting" | "analyzing" | null;

export default function Home() {
  const { t, locale } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(null);
  const [videosFound, setVideosFound] = useState(0);
  const [analyzeProgress, setAnalyzeProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setHasSearched(true);
    setLoadingPhase("searching");
    setVideosFound(0);
    setAnalyzeProgress({ current: 0, total: 0 });

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, locale }),
      });

      if (!response.ok || !response.body) {
        throw new Error("API error");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const match = line.match(/^data: (.+)$/);
          if (!match) continue;

          try {
            const { event, data } = JSON.parse(match[1]);

            if (event === "search_done") {
              setVideosFound(data.count as number);
              setLoadingPhase("extracting");
            } else if (event === "extraction_complete") {
              setLoadingPhase("analyzing");
            } else if (event === "analyzing_video") {
              setAnalyzeProgress({
                current: (data.index as number) + 1,
                total: data.total as number,
              });
            } else if (event === "complete") {
              setResult(data as AnalysisResult);
              setLoadingPhase(null);
              setTimeout(() => {
                resultsRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 200);
            } else if (event === "error") {
              if (data.code === "no_videos") {
                setError(t.noResults);
              } else {
                setError(data.message || t.errorMessage);
              }
              setLoadingPhase(null);
            }
          } catch {
            // skip malformed SSE
          }
        }
      }
    } catch {
      setError(t.errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingPhase(null);
    }
  };

  const steps = [
    { num: "1", title: t.steps.step1, desc: t.steps.step1Desc },
    { num: "2", title: t.steps.step2, desc: t.steps.step2Desc },
    { num: "3", title: t.steps.step3, desc: t.steps.step3Desc },
    { num: "4", title: t.steps.step4, desc: t.steps.step4Desc },
  ];

  const features = [
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      ),
      title: t.features.searchTitle,
      desc: t.features.searchDesc,
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
        </svg>
      ),
      title: t.features.analysisTitle,
      desc: t.features.analysisDesc,
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
      ),
      title: t.features.reportTitle,
      desc: t.features.reportDesc,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight">{t.title}</span>
          </div>
          <LanguageToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        {/* Hero Section */}
        {!hasSearched && (
          <section className="pb-16 pt-20 text-center">
            <h1 className="mx-auto max-w-2xl whitespace-pre-line text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              {t.heroTitle}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              {t.heroDescription}
            </p>

            <div className="mx-auto mt-10 max-w-2xl">
              <SearchForm onSearch={handleSearch} isLoading={isLoading} />
            </div>

            <div className="mt-16">
              <h2 className="mb-8 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t.howItWorks}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {steps.map((step) => (
                  <div key={step.num} className="relative rounded-xl border bg-card p-4 text-left">
                    <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                      {step.num}
                    </div>
                    <p className="text-sm font-semibold">{step.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-3">
              {features.map((feat) => (
                <Card key={feat.title} className="text-left">
                  <CardContent className="pt-6">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      {feat.icon}
                    </div>
                    <h3 className="text-sm font-semibold">{feat.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{feat.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Active search view */}
        {hasSearched && (
          <section className="space-y-8 py-8">
            <SearchForm onSearch={handleSearch} isLoading={isLoading} />

            {isLoading && loadingPhase && (
              <LoadingScreen
                phase={loadingPhase}
                videosFound={videosFound}
                analyzeProgress={analyzeProgress}
              />
            )}

            {error && !isLoading && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-center text-sm text-destructive">
                {error}
              </div>
            )}

            <div ref={resultsRef}>
              {result && (
                <>
                  <AggregateReport
                    scores={result.aggregateScores}
                    videoCount={result.videoAnalyses.length}
                  />

                  <div className="mt-8">
                    <h2 className="mb-4 text-lg font-semibold">{t.videoBreakdown}</h2>
                    <div className="space-y-4">
                      {result.videoAnalyses.map((analysis) => (
                        <ReportCard key={analysis.videoId} analysis={analysis} />
                      ))}
                    </div>
                  </div>

                  <p className="mt-8 text-center text-xs text-muted-foreground">{t.poweredBy}</p>
                </>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="mt-20 border-t">
        <div className="mx-auto max-w-5xl px-6 py-6 text-center text-xs text-muted-foreground">
          {t.poweredBy}
        </div>
      </footer>
    </div>
  );
}
