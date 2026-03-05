"use client";

import { useLanguage } from "@/lib/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "./score-bar";
import type { VideoAnalysis } from "@/lib/analyzer";
import type { SensoryScores } from "@/lib/analyzer";

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
          <Badge variant="outline" className="w-fit text-xs">
            {analysis.channelTitle}
          </Badge>
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
