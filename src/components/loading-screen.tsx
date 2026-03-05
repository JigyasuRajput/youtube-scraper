"use client";

import { useLanguage } from "@/lib/language-context";

interface LoadingScreenProps {
  phase: "searching" | "extracting" | "analyzing";
  videosFound: number;
  analyzeProgress: { current: number; total: number };
}

export function LoadingScreen({
  phase,
  videosFound,
  analyzeProgress,
}: LoadingScreenProps) {
  const { t } = useLanguage();

  const phases = [
    {
      key: "searching",
      label: t.loading.step1,
    },
    {
      key: "extracting",
      label: videosFound
        ? t.loading.step2With.replace("{n}", String(videosFound))
        : t.loading.step2,
    },
    {
      key: "analyzing",
      label:
        analyzeProgress.total > 0
          ? t.loading.step3With
              .replace("{c}", String(analyzeProgress.current))
              .replace("{t}", String(analyzeProgress.total))
          : t.loading.step3,
    },
  ];

  const currentIndex = phases.findIndex((p) => p.key === phase);

  return (
    <div className="flex flex-col items-center justify-center py-20">
      {/* Spinner */}
      <div className="relative mb-8">
        <div className="h-16 w-16 rounded-full border-4 border-muted" />
        <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-foreground" />
      </div>

      {/* Current phase label */}
      <p className="mb-8 text-lg font-medium">{phases[currentIndex]?.label}</p>

      {/* Step indicators */}
      <div className="flex items-center gap-3">
        {phases.map((p, i) => (
          <div key={p.key} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-500 ${
                i < currentIndex
                  ? "bg-foreground text-background"
                  : i === currentIndex
                    ? "bg-foreground text-background scale-110"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < currentIndex ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            {i < phases.length - 1 && (
              <div
                className={`h-0.5 w-8 transition-colors duration-500 ${
                  i < currentIndex ? "bg-foreground" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step labels below */}
      <div className="mt-3 flex items-start gap-3">
        {phases.map((p, i) => (
          <div key={p.key} className="flex items-center gap-3">
            <span
              className={`w-8 text-center text-[10px] leading-tight ${
                i === currentIndex
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {[t.loading.label1, t.loading.label2, t.loading.label3][i]}
            </span>
            {i < phases.length - 1 && <div className="w-8" />}
          </div>
        ))}
      </div>
    </div>
  );
}
