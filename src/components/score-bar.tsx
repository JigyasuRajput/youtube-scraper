"use client";

import { Progress } from "@/components/ui/progress";

interface ScoreBarProps {
  label: string;
  score: number;
}

export function ScoreBar({ label, score }: ScoreBarProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 text-sm text-muted-foreground">
        {label}
      </span>
      <Progress value={score * 10} className="flex-1" />
      <span className="w-10 shrink-0 text-right font-mono text-sm font-semibold">
        {score.toFixed(1)}
      </span>
    </div>
  );
}
