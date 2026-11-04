"use client";

import { useEffect, useState } from "react";
import { Check, Circle } from "lucide-react";

interface GenerationProgressProps {
  goal: string;
  targetWeeks: number;
  hoursPerWeek: number;
}

const STAGES = [
  { id: 1, label: "Formulating pedagogical dependency graph" },
  { id: 2, label: "Calibrating session time budgets and prerequisite order" },
  { id: 3, label: "Querying YouTube Data API for candidate video lectures" },
  { id: 4, label: "Enriching view statistics and scoring candidate relevance" },
  { id: 5, label: "Selecting primary and alternate videos with GPT-4o" },
];

export function GenerationProgress({
  goal,
  targetWeeks,
  hoursPerWeek,
}: GenerationProgressProps) {
  const [currentStage, setCurrentStage] = useState(1);

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStage(2), 2200);
    const timer2 = setTimeout(() => setCurrentStage(3), 4800);
    const timer3 = setTimeout(() => setCurrentStage(4), 8500);
    const timer4 = setTimeout(() => setCurrentStage(5), 12500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-[var(--ink)] mb-2">
          Assembling curriculum for &ldquo;{goal}&rdquo;
        </h2>
        <p className="text-sm text-[var(--ink-muted)]">
          Pacing: {targetWeeks} weeks · {hoursPerWeek} hours/week · Vetting real video sessions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Pipeline Stages */}
        <div className="md:col-span-1 space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-[var(--ink-muted)] mb-2">
            Pipeline Steps
          </div>
          <div className="space-y-3">
            {STAGES.map((stage) => {
              const isDone = currentStage > stage.id;
              const isCurrent = currentStage === stage.id;

              return (
                <div
                  key={stage.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-xs transition-all duration-200 ${
                    isCurrent
                      ? "border-[var(--accent)] bg-[var(--surface)] text-[var(--ink)] font-medium shadow-sm"
                      : isDone
                      ? "border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink-muted)]"
                      : "border-transparent text-[var(--ink-muted)] opacity-50"
                  }`}
                >
                  <div className="mt-0.5">
                    {isDone ? (
                      <div className="w-4 h-4 rounded-full bg-[var(--accent)] text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-4 h-4 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                    ) : (
                      <Circle className="w-4 h-4 text-[var(--line)] stroke-[1.5]" />
                    )}
                  </div>
                  <div className="leading-snug">{stage.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live Skeleton Timeline filling in */}
        <div className="md:col-span-2 bg-[var(--surface)] border border-[var(--line)] rounded-xl p-6">
          <div className="text-xs font-mono uppercase tracking-wider text-[var(--ink-muted)] mb-4 flex items-center justify-between">
            <span>Timeline Skeleton</span>
            <span className="text-[var(--accent)]">
              {currentStage <= 2 ? "Structuring phases..." : "Attaching videos..."}
            </span>
          </div>

          <div className="space-y-6">
            {/* Phase 1 Skeleton */}
            <div className="border-l-2 border-[var(--accent)] pl-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                <div
                  className={`h-4 bg-[var(--surface-2)] rounded w-48 transition-all ${
                    currentStage >= 1 ? "opacity-100" : "opacity-30"
                  }`}
                />
              </div>

              {/* Sessions Skeleton */}
              <div className="space-y-2 pt-1">
                {[1, 2].map((s) => (
                  <div
                    key={s}
                    className="p-3 rounded-lg border border-[var(--line)] bg-[var(--bg)] flex items-center justify-between animate-pulse"
                  >
                    <div className="space-y-1.5 flex-1 pr-4">
                      <div className="h-3.5 bg-[var(--surface-2)] rounded w-3/4" />
                      <div className="h-2.5 bg-[var(--surface-2)] rounded w-1/2" />
                    </div>
                    <div className="h-4 w-12 bg-[var(--surface-2)] rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Phase 2 Skeleton */}
            <div className="border-l-2 border-[var(--line)] pl-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full border border-[var(--ink-muted)]" />
                <div
                  className={`h-4 bg-[var(--surface-2)] rounded w-40 transition-all ${
                    currentStage >= 2 ? "opacity-100" : "opacity-30"
                  }`}
                />
              </div>

              <div className="space-y-2 pt-1">
                <div className="p-3 rounded-lg border border-[var(--line)] bg-[var(--bg)] flex items-center justify-between opacity-50">
                  <div className="space-y-1.5 flex-1 pr-4">
                    <div className="h-3.5 bg-[var(--surface-2)] rounded w-2/3" />
                    <div className="h-2.5 bg-[var(--surface-2)] rounded w-1/3" />
                  </div>
                  <div className="h-4 w-12 bg-[var(--surface-2)] rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
