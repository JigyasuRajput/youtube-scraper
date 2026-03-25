"use client";

import { useLanguage } from "@/lib/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "./score-bar";
import type { VideoAnalysis, SensoryScores } from "@/lib/analyzer";

interface ReportCardProps {
  analysis: VideoAnalysis;
}

export function ReportCard({ analysis }: ReportCardProps) {
  const { t } = useLanguage();

  const dimensions: { key: keyof SensoryScores; label: string }[] = [
    { key: "gripFeel", label: t.dimensions.gripFeel },
    { key: "swingSensation", label: t.dimensions.swingSensation },
    { key: "weightBalance", label: t.dimensions.weightBalance },
    { key: "castingPerformance", label: t.dimensions.castingPerformance },
    { key: "durabilityImpression", label: t.dimensions.durabilityImpression },
    { key: "overallSatisfaction", label: t.dimensions.overallSatisfaction },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2">
          <CardTitle className="text-base leading-snug">
            <a
              href={analysis.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {analysis.title}
            </a>
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={analysis.source === "naturum" ? "default" : "secondary"}
              className="text-xs"
            >
              {analysis.source === "naturum" ? "Naturum" : "YouTube"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {analysis.channelTitle}
            </Badge>
            <a
              href={analysis.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {analysis.source === "naturum" ? (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l4.071-4.071A1.5 1.5 0 0 1 8.06 0h7.88a1.5 1.5 0 0 1 1.06.44l4.071 4.071a3 3 0 0 1-.621 4.72" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z"/>
                </svg>
              )}
              {analysis.source === "naturum" ? t.naturumLink : t.sourceLink}
            </a>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          {dimensions.map((dim) => (
            <ScoreBar
              key={dim.key}
              label={dim.label}
              score={analysis.scores[dim.key]}
            />
          ))}
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold">{t.summary}</h4>
          <p className="text-sm text-muted-foreground">{analysis.summary}</p>
        </div>

        {analysis.quotes.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold">{t.quotes}</h4>
            <ul className="space-y-2">
              {analysis.quotes.map((quote, i) => (
                <li
                  key={i}
                  className="border-l-2 border-muted-foreground/30 pl-3 text-sm italic text-muted-foreground"
                >
                  &ldquo;{quote}&rdquo;
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
