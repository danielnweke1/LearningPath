"use client";

import { Plan } from "@/types/plan";
import { ThemeToggle } from "./ThemeToggle";
import {
  Download,
  Command,
  HelpCircle,
  Plus,
  BookOpen,
  ArrowLeft,
} from "lucide-react";

interface HeaderProps {
  plan: Plan | null;
  totalSessions: number;
  completedSessionsCount: number;
  streakDays?: number;
  onGoHome: () => void;
  onNewPlan: () => void;
  onResumePlan?: () => void;
  isViewingHome?: boolean;
  hasActivePlan?: boolean;
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
  onOpenExport: () => void;
  isDemo?: boolean;
}

export function Header({
  plan,
  totalSessions,
  completedSessionsCount,
  streakDays = 1,
  onGoHome,
  onNewPlan,
  onResumePlan,
  isViewingHome = false,
  hasActivePlan = false,
  onOpenCommandPalette,
  onOpenShortcuts,
  onOpenExport,
  isDemo = false,
}: HeaderProps) {
  const progressRatio = totalSessions > 0 ? completedSessionsCount / totalSessions : 0;
  const progressPercent = Math.round(progressRatio * 100);

  return (
    <header className="sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--line)]">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onGoHome}
            aria-label="LearningPath Home"
            className="flex items-center gap-2 cursor-pointer group text-left"
          >
            <div className="w-6 h-6 rounded bg-[var(--accent)] text-white flex items-center justify-center font-serif text-sm font-bold shadow-2xs group-hover:scale-105 transition-transform">
              L
            </div>
            <span className="font-serif text-base font-medium tracking-tight text-[var(--ink)]">
              LearningPath
            </span>
          </button>

          {!isViewingHome && plan && (
            <>
              <span className="text-[var(--line)] hidden sm:inline">/</span>
              <div className="min-w-0 hidden md:block">
                <span className="text-xs text-[var(--ink)] font-medium truncate block max-w-xs" title={plan.title}>
                  {plan.title}
                </span>
              </div>
            </>
          )}

          {isDemo && !isViewingHome && (
            <span className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-mono rounded bg-[var(--surface-2)] border border-[var(--line)] text-[var(--accent)] font-medium">
              Demo
            </span>
          )}
        </div>

        {/* Center: Quiet Progress Indicator (if plan loaded and not on homepage) */}
        {!isViewingHome && plan && (
          <div className="hidden lg:flex items-center gap-4 flex-1 max-w-sm mx-auto">
            <div className="w-full space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-[var(--ink-muted)]">
                <span>
                  {completedSessionsCount} of {totalSessions} sessions ({progressPercent}%)
                </span>
                <span>
                  {completedSessionsCount >= 2 ? "1 week ahead" : "on track"}
                </span>
              </div>
              {/* Thin Segmented Progress Bar */}
              <div className="w-full h-1 bg-[var(--line)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)] transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div className="text-[11px] text-[var(--ink-muted)] font-mono whitespace-nowrap">
              {streakDays}d streak
            </div>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* If on home and has active plan */}
          {isViewingHome && hasActivePlan && onResumePlan && (
            <button
              onClick={onResumePlan}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-white hover:opacity-95 transition-opacity cursor-pointer shadow-2xs"
            >
              <span>Resume Roadmap</span>
              <span className="hidden sm:inline">→</span>
            </button>
          )}

          {/* If on home and wants to build custom */}
          {isViewingHome && (
            <button
              onClick={onNewPlan}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] hover:bg-[var(--line)] text-xs font-medium text-[var(--ink)] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2]" />
              <span>Create Plan</span>
            </button>
          )}

          {!isViewingHome && plan && (
            <>
              {/* Home link */}
              <button
                onClick={onGoHome}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
              >
                <span>Home</span>
              </button>

              {/* Cmd+K trigger */}
              <button
                onClick={onOpenCommandPalette}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-[var(--ink-muted)] bg-[var(--surface-2)] border border-[var(--line)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                title="Search curriculum (Cmd+K)"
              >
                <Command className="w-3.5 h-3.5 stroke-[1.5]" />
                <span className="font-mono text-[11px]">K</span>
              </button>

              {/* Shortcuts trigger */}
              <button
                onClick={onOpenShortcuts}
                aria-label="Keyboard Shortcuts"
                className="p-1.5 rounded-md text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] border border-[var(--line)] cursor-pointer"
                title="Keyboard Shortcuts (?)"
              >
                <HelpCircle className="w-4 h-4 stroke-[1.5]" />
              </button>

              {/* Export menu */}
              <button
                onClick={onOpenExport}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--ink)] bg-[var(--surface-2)] border border-[var(--line)] hover:bg-[var(--line)] transition-colors cursor-pointer"
                title="Export PDF / Calendar"
              >
                <Download className="w-3.5 h-3.5 stroke-[1.5]" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {/* New Plan */}
              <button
                onClick={onNewPlan}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-[var(--accent)] text-white hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2]" />
                <span className="hidden sm:inline">New Plan</span>
              </button>
            </>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
