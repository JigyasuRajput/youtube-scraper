"use client";

import { useLanguage } from "@/lib/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "./score-bar";
import type { SensoryScores } from "@/lib/analyzer";

interface AggregateReportProps {
  scores: SensoryScores;
  videoCount: number;
}

export function AggregateReport({ scores, videoCount }: AggregateReportProps) {
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
        <div className="flex items-center justify-between">
          <CardTitle>{t.aggregateTitle}</CardTitle>
          <Badge variant="secondary">
            {videoCount} {t.videoCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {dimensions.map((dim) => (
          <ScoreBar
            key={dim.key}
            label={dim.label}
            score={scores[dim.key]}
          />
        ))}
      </CardContent>
    </Card>
  );
}
