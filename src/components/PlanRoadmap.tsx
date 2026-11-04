"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Plan,
  Phase,
  Week,
  Session,
  PlanProgress,
  ReplanPatch,
} from "@/types/plan";
import { SessionDetail } from "./SessionDetail";
import { ReplanDiffModal } from "./ReplanDiffModal";
import {
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Sliders,
  Sparkles,
  Award,
  Layers,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Compass,
  ChevronLeft,
  Play,
} from "lucide-react";

interface PlanRoadmapProps {
  plan: Plan;
  progress: PlanProgress;
  onUpdateProgress: (newProgress: PlanProgress) => void;
  onUpdatePlan?: (newPlan: Plan) => void;
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
  isDemo?: boolean;
}

export function PlanRoadmap({
  plan,
  progress,
  onUpdateProgress,
  onUpdatePlan,
  onOpenCommandPalette,
  onOpenShortcuts,
  isDemo = false,
}: PlanRoadmapProps) {
  // Current active / selected session
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Auto-follow scroll state (defaults to true so video pane follows timeline scrolling)
  const [autoFollowScroll, setAutoFollowScroll] = useState<boolean>(true);

  // Collapsed phases & weeks state (current week expanded by default)
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});
  const [activeWeekNumber, setActiveWeekNumber] = useState<number>(progress.currentWeekNumber || 1);

  // Main scrollable timeline container ref
  const mainScrollRef = useRef<HTMLElement>(null);
  const manualSelectionLockUntilRef = useRef<number>(0);

  // Replanning state
  const [replanPatch, setReplanPatch] = useState<ReplanPatch | null>(null);
  const [isReplanModalOpen, setIsReplanModalOpen] = useState(false);
  const [isReplanning, setIsReplanning] = useState(false);

  // Flattened session list for keyboard navigation (j/k)
  const flatSessions = useMemo(() => {
    const list: Session[] = [];
    for (const phase of plan.phases) {
      for (const week of phase.weeks) {
        for (const session of week.sessions) {
          list.push(session);
        }
      }
    }
    return list;
  }, [plan]);

  // Active session context (phase, week, and session indices)
  const activeSessionContext = useMemo(() => {
    if (!selectedSessionId) return null;
    for (let pIdx = 0; pIdx < plan.phases.length; pIdx++) {
      const phase = plan.phases[pIdx];
      for (const week of phase.weeks) {
        const sIdx = week.sessions.findIndex((s) => s.id === selectedSessionId);
        if (sIdx !== -1) {
          return {
            session: week.sessions[sIdx],
            phaseNumber: pIdx + 1,
            phaseTitle: phase.title,
            weekNumber: week.number,
            weekTheme: week.theme,
            sessionIndex: sIdx + 1,
            totalSessionsInWeek: week.sessions.length,
          };
        }
      }
    }
    return null;
  }, [plan, selectedSessionId]);

  // Auto-select initial session on mount
  const hasInitializedSelection = useRef(false);
  useEffect(() => {
    if (!hasInitializedSelection.current && flatSessions.length > 0) {
      hasInitializedSelection.current = true;
      setSelectedSessionId(flatSessions[0].id);
    }
  }, [flatSessions]);

  // Find active session object
  const activeSession = useMemo(() => {
    if (!selectedSessionId) return null;
    return flatSessions.find((s) => s.id === selectedSessionId) || null;
  }, [flatSessions, selectedSessionId]);

  // Keep mutable refs for current selection to prevent effect teardown during scrolling
  const selectedSessionIdRef = useRef<string | null>(selectedSessionId);
  selectedSessionIdRef.current = selectedSessionId;

  const activeWeekNumberRef = useRef<number>(activeWeekNumber);
  activeWeekNumberRef.current = activeWeekNumber;

  // Synchronized Scroll-Spy:
  // Tracks user's focal reading area and smoothly updates the sticky video dock
  useEffect(() => {
    if (!autoFollowScroll) return;

    let rafId: number | null = null;

    const updateActiveSessionOnScroll = () => {
      // If user recently clicked a session, do not override during smooth scroll
      if (Date.now() < manualSelectionLockUntilRef.current) return;

      const cards = document.querySelectorAll<HTMLElement>("[data-session-id]");
      if (cards.length === 0) return;

      const winHeight = window.innerHeight;
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;

      // Top boundary: at the very top of page, anchor to first session
      if (scrollY < 120 && flatSessions.length > 0) {
        const firstId = flatSessions[0].id;
        if (selectedSessionIdRef.current !== firstId) {
          selectedSessionIdRef.current = firstId;
          setSelectedSessionId(firstId);
        }
        if (activeWeekNumberRef.current !== 1) {
          activeWeekNumberRef.current = 1;
          setActiveWeekNumber(1);
        }
        return;
      }

      // Focal reading line (38% from top of viewport)
      const focalY = winHeight * 0.38;
      let closestId: string | null = null;
      let smallestDist = Infinity;
      let targetWeek = activeWeekNumberRef.current;

      cards.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Skip cards completely off-screen
        if (rect.bottom < 40 || rect.top > winHeight - 40) return;

        const cardCenterY = rect.top + rect.height / 2;
        const dist = Math.abs(cardCenterY - focalY);

        if (dist < smallestDist) {
          smallestDist = dist;
          closestId = el.getAttribute("data-session-id");
          const weekAttr = el.getAttribute("data-week-number");
          if (weekAttr) targetWeek = parseInt(weekAttr, 10);
        }
      });

      if (closestId && closestId !== selectedSessionIdRef.current) {
        selectedSessionIdRef.current = closestId;
        setSelectedSessionId(closestId);
      }
      if (targetWeek && targetWeek !== activeWeekNumberRef.current) {
        activeWeekNumberRef.current = targetWeek;
        setActiveWeekNumber(targetWeek);
      }
    };

    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateActiveSessionOnScroll);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { capture: true, passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll, true);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [autoFollowScroll, flatSessions]);

  // Smoothly scroll a session into view when selected
  const handleSelectSession = (sessionId: string, scrollIntoTimeline = false) => {
    manualSelectionLockUntilRef.current = Date.now() + 1500;
    selectedSessionIdRef.current = sessionId;
    setSelectedSessionId(sessionId);
    if (scrollIntoTimeline) {
      const el = document.querySelector<HTMLElement>(`[data-session-id="${sessionId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  // Navigate to previous session
  const handlePrevSession = () => {
    const currentIdx = flatSessions.findIndex((s) => s.id === selectedSessionId);
    if (currentIdx > 0) {
      handleSelectSession(flatSessions[currentIdx - 1].id, true);
    }
  };

  // Navigate to next session
  const handleNextSession = () => {
    const currentIdx = flatSessions.findIndex((s) => s.id === selectedSessionId);
    if (currentIdx !== -1 && currentIdx + 1 < flatSessions.length) {
      handleSelectSession(flatSessions[currentIdx + 1].id, true);
    }
  };

  // Scroll main container to specific element
  const scrollToContainer = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Global Keyboard Shortcuts (j/k, Enter, x, ?, Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenCommandPalette();
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        onOpenShortcuts();
        return;
      }

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        handleNextSession();
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        handlePrevSession();
      } else if (e.key.toLowerCase() === "x" && activeSession) {
        e.preventDefault();
        handleToggleSessionComplete(activeSession.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flatSessions, selectedSessionId, activeSession, onOpenCommandPalette, onOpenShortcuts]);

  const handleToggleSessionComplete = (sessionId: string) => {
    const isCompleted = progress.completedSessionIds.includes(sessionId);
    const nextCompleted = isCompleted
      ? progress.completedSessionIds.filter((id) => id !== sessionId)
      : [...progress.completedSessionIds, sessionId];

    onUpdateProgress({
      ...progress,
      completedSessionIds: nextCompleted,
    });
  };

  const handleTogglePhaseProject = (phaseId: string) => {
    const isCompleted = progress.projectCompletedPhases.includes(phaseId);
    const nextProjects = isCompleted
      ? progress.projectCompletedPhases.filter((id) => id !== phaseId)
      : [...progress.projectCompletedPhases, phaseId];

    onUpdateProgress({
      ...progress,
      projectCompletedPhases: nextProjects,
    });
  };

  const handleSaveAnswer = (questionId: string, selectedIndex: number, isCorrect: boolean) => {
    if (!activeSession) return;
    const sessionId = activeSession.id;
    const existing = progress.checkpointAnswers[sessionId] || [];
    const updated = [
      ...existing.filter((a) => a.questionId !== questionId),
      { questionId, selectedIndex, isCorrect },
    ];

    onUpdateProgress({
      ...progress,
      checkpointAnswers: {
        ...progress.checkpointAnswers,
        [sessionId]: updated,
      },
    });
  };

  // Update a session (e.g. attaching generated theoretical discourse) and persist
  const handleUpdateSession = (updatedSession: Session) => {
    const updatedPhases = plan.phases.map((phase) => ({
      ...phase,
      weeks: phase.weeks.map((week) => ({
        ...week,
        sessions: week.sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s)),
      })),
    }));

    const updatedPlan: Plan = {
      ...plan,
      phases: updatedPhases,
    };

    if (onUpdatePlan) {
      onUpdatePlan(updatedPlan);
    }
  };

  // Trigger Adaptive Replanning
  const handleFeedback = async (type: "too_easy" | "too_hard" | "stuck") => {
    setIsReplanning(true);

    if (isDemo) {
      // In demo mode, use precomputed adjustment
      setReplanPatch({
        explanation: `Demo pacing adjustment applied (${type.replace("_", " ")}). Reinforced intermediate exercises and scheduled dedicated review sessions.`,
        modifications: [
          {
            type: "modify",
            phaseId: plan.phases[0]?.id || "p1",
            weekNumber: activeWeekNumber,
            changes: `Calibrated upcoming sessions with complementary deep dive walkthroughs.`,
          },
        ],
      });
      setIsReplanModalOpen(true);
      setIsReplanning(false);
      return;
    }

    try {
      const completedTitles = flatSessions
        .filter((s) => progress.completedSessionIds.includes(s.id))
        .map((s) => s.title);

      const res = await fetch("/api/plan/replan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPlanTitle: plan.title,
          completedSessionTitles: completedTitles,
          triggerReason: `User triggered: ${type}`,
          remainingWeeks: plan.intake.targetWeeks - activeWeekNumber + 1,
          hoursPerWeek: plan.intake.hoursPerWeek,
          phases: plan.phases,
        }),
      });

      const data = await res.json();
      if (data.patch) {
        setReplanPatch(data.patch);
        setIsReplanModalOpen(true);
      }
    } catch (e) {
      console.warn("Replanning notice:", e);
    } finally {
      setIsReplanning(false);
    }
  };

  const handleAcceptReplan = () => {
    // Save feedback into progress state
    if (activeSession) {
      onUpdateProgress({
        ...progress,
        sessionFeedback: {
          ...progress.sessionFeedback,
          [activeSession.id]: "too_hard",
        },
      });
    }
  };

  // Reset window scroll to top when mounting or plan changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [plan.id]);

  const currentSessionIndex = flatSessions.findIndex((s) => s.id === selectedSessionId);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] select-none">
      {/* Demo Banner */}
      {isDemo && (
        <div className="bg-[var(--surface-2)] border-b border-[var(--line)] px-4 py-2 text-xs text-[var(--ink-muted)] flex items-center justify-between flex-shrink-0">
          <span>
            <strong className="text-[var(--accent)] font-medium">Demo Mode:</strong> All sessions,
            checkpoints, and completion tracking work locally in your browser.
          </span>
          <span className="font-mono text-[11px] hidden sm:inline">Zero API network calls</span>
        </div>
      )}

      {/* Top Roadmap Controls Bar (Sub-header, sticky under the main header) */}
      <div className="sticky top-14 z-30 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--line)] px-4 lg:px-8 py-2.5 flex items-center justify-between flex-shrink-0 shadow-xs">
        {/* Left: Active Week indicator */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-xs font-serif font-medium text-[var(--ink)] whitespace-nowrap">
              Week {activeWeekNumber} of {plan.intake.targetWeeks}
            </span>
          </div>
          <span className="text-[var(--line)] hidden sm:inline">|</span>
          <span className="text-xs text-[var(--ink-muted)] hidden sm:inline truncate max-w-sm">
            {flatSessions[currentSessionIndex]?.title || plan.title}
          </span>
        </div>

        {/* Center / Right Controls: Auto-Follow Scroll Toggle & Session Nav */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Auto-Follow Scroll Toggle Pill */}
          <button
            onClick={() => setAutoFollowScroll(!autoFollowScroll)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              autoFollowScroll
                ? "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/40 shadow-xs"
                : "bg-[var(--surface-2)] text-[var(--ink-muted)] border-[var(--line)] hover:text-[var(--ink)]"
            }`}
            title={
              autoFollowScroll
                ? "Auto-Follow Video is ON: video dock stays in view and automatically updates as you scroll the timeline"
                : "Auto-Follow Video is PAUSED: click to re-enable continuous scroll tracking"
            }
          >
            <Compass className={`w-3.5 h-3.5 ${autoFollowScroll ? "text-[var(--accent)]" : ""}`} />
            <span className="hidden sm:inline">Auto-Follow Video:</span>
            <span className="font-semibold">{autoFollowScroll ? "ON" : "OFF"}</span>
          </button>

          {/* Prev / Next Keyboard Navigation */}
          <div className="flex items-center gap-1 border border-[var(--line)] rounded-lg p-0.5 bg-[var(--surface-2)] shadow-2xs">
            <button
              onClick={handlePrevSession}
              disabled={currentSessionIndex <= 0}
              aria-label="Previous lesson"
              className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--ink)] disabled:opacity-30 transition-colors cursor-pointer"
              title="Previous lesson (K)"
            >
              <ChevronLeft className="w-4 h-4 stroke-[1.5]" />
            </button>
            <span className="text-[10px] font-mono text-[var(--ink-muted)] px-1.5 tabular-nums">
              {currentSessionIndex + 1}/{flatSessions.length}
            </span>
            <button
              onClick={handleNextSession}
              disabled={currentSessionIndex >= flatSessions.length - 1}
              aria-label="Next lesson"
              className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--ink)] disabled:opacity-30 transition-colors cursor-pointer"
              title="Next lesson (J)"
            >
              <ChevronRight className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Zone Natural-Scrolling Desktop Grid */}
      <div className="max-w-[1750px] mx-auto px-4 lg:px-8 w-full flex flex-col md:flex-row gap-8 relative items-start py-6">
        {/* 1. Left Rail (Sticky Outline at top-28): Stays pinned to viewport while scrolling */}
        <aside className="hidden md:block w-72 lg:w-80 flex-shrink-0 sticky top-28 self-start max-h-[calc(100vh-8.5rem)] overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 space-y-4 shadow-xs">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--ink-muted)]">
              Curriculum Outline
            </span>
            <span className="text-[11px] font-mono text-[var(--ink-muted)]">
              {plan.phases.length} Phases
            </span>
          </div>

          <div className="space-y-3">
            {plan.phases.map((phase) => {
              const isPhaseCollapsed = collapsedPhases[phase.id];
              const totalPhaseSessions = phase.weeks.flatMap((w) => w.sessions);
              const completedPhaseSessions = totalPhaseSessions.filter((s) =>
                progress.completedSessionIds.includes(s.id)
              );
              const isPhaseDone =
                totalPhaseSessions.length > 0 &&
                completedPhaseSessions.length === totalPhaseSessions.length;

              return (
                <div
                  key={phase.id}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] overflow-hidden shadow-2xs"
                >
                  {/* Phase Header */}
                  <button
                    onClick={() => {
                      setCollapsedPhases((prev) => ({
                        ...prev,
                        [phase.id]: !prev[phase.id],
                      }));
                      scrollToContainer(`phase-${phase.id}`);
                    }}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-[var(--line)]/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          isPhaseDone ? "bg-[var(--accent)] ring-2 ring-[var(--accent-soft)]" : "border border-[var(--ink-muted)]"
                        }`}
                      />
                      <span className="text-xs font-serif font-medium text-[var(--ink)] truncate">
                        {phase.title}
                      </span>
                    </div>
                    {isPhaseCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-[var(--ink-muted)] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-[var(--ink-muted)] flex-shrink-0" />
                    )}
                  </button>

                  {/* Weeks under Phase */}
                  {!isPhaseCollapsed && (
                    <div className="border-t border-[var(--line)] bg-[var(--surface)] divide-y divide-[var(--line)]">
                      {phase.weeks.map((week) => {
                        const isCurrentWeek = activeWeekNumber === week.number;
                        const weekCompletedCount = week.sessions.filter((s) =>
                          progress.completedSessionIds.includes(s.id)
                        ).length;

                        return (
                          <div
                            key={week.number}
                            onClick={() => {
                              setActiveWeekNumber(week.number);
                              scrollToContainer(`week-${week.number}`);
                            }}
                            className={`p-2.5 cursor-pointer text-xs transition-colors flex items-center justify-between ${
                              isCurrentWeek
                                ? "bg-[var(--accent-soft)] text-[var(--ink)] font-medium border-l-3 border-[var(--accent)]"
                                : "hover:bg-[var(--surface-2)] text-[var(--ink)]"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <span
                                className={`font-mono text-[11px] ${
                                  isCurrentWeek ? "text-[var(--accent)] font-semibold" : "text-[var(--ink-muted)]"
                                }`}
                              >
                                W{week.number}
                              </span>
                              <span className="truncate text-xs">{week.theme}</span>
                            </div>

                            <span className="text-[10px] font-mono text-[var(--ink-muted)] flex-shrink-0">
                              {weekCompletedCount}/{week.sessions.length}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* 2. Center Timeline: Current Week & Sessions (Scrolls naturally down the page) */}
        <main className="flex-1 min-w-0 max-w-2xl mx-auto space-y-12 select-text pb-28">
          {plan.phases.map((phase) => {
            const phaseWeeks = phase.weeks;
            return (
              <div key={phase.id} id={`phase-${phase.id}`} className="space-y-6">
                {/* Phase Marker Node */}
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full bg-[var(--accent)] ring-4 ring-[var(--accent-soft)] flex-shrink-0" />
                  <div>
                    <h2 className="text-xl font-serif font-medium text-[var(--ink)]">
                      {phase.title}
                    </h2>
                    <p className="text-xs text-[var(--ink-muted)] mt-0.5">{phase.goal}</p>
                  </div>
                </div>

                {/* Weeks in Phase */}
                <div className="border-l-2 border-[var(--line)] ml-1.5 pl-6 space-y-8">
                  {phaseWeeks.map((week) => (
                    <div key={week.number} id={`week-${week.number}`} className="space-y-3">
                      {/* Week Theme Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-xs font-mono uppercase tracking-wider text-[var(--ink-muted)] font-semibold">
                          {week.theme}
                        </span>
                        <span className="text-xs font-mono text-[var(--ink-muted)] flex-shrink-0">
                          Week {week.number} of {plan.intake.targetWeeks}
                        </span>
                      </div>

                      {/* Sessions List */}
                      <div className="space-y-2.5">
                        {week.sessions.map((session) => {
                          const isDone = progress.completedSessionIds.includes(session.id);
                          const isSelected = selectedSessionId === session.id;

                          return (
                            <div
                              key={session.id}
                              data-session-id={session.id}
                              data-week-number={week.number}
                              onClick={() => handleSelectSession(session.id, false)}
                              className={`group min-h-[58px] px-4 py-3.5 rounded-xl border text-sm transition-all cursor-pointer flex items-center justify-between gap-4 ${
                                isSelected
                                  ? "border-[var(--accent)] bg-[var(--surface)] ring-2 ring-[var(--accent)]/20 shadow-md transform -translate-y-0.5"
                                  : "border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] hover:border-[var(--ink-muted)]/40"
                              }`}
                            >
                              {/* Left: Status check + Title + Active tag */}
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleSessionComplete(session.id);
                                  }}
                                  className="text-[var(--ink-muted)] hover:text-[var(--accent)] flex-shrink-0 transition-colors cursor-pointer"
                                  title={isDone ? "Mark incomplete (x)" : "Mark complete (x)"}
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="w-4 h-4 text-[var(--accent)] fill-[var(--accent-soft)]" />
                                  ) : (
                                    <Circle className="w-4 h-4 stroke-[1.5]" />
                                  )}
                                </button>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={`text-xs sm:text-sm font-medium truncate ${
                                        isDone ? "text-[var(--ink-muted)] line-through" : "text-[var(--ink)]"
                                      }`}
                                    >
                                      {session.title}
                                    </span>

                                    {/* Active Video Dock Tag */}
                                    {isSelected && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono uppercase tracking-wider bg-[var(--accent-soft)] text-[var(--accent)] font-semibold border border-[var(--accent)]/30">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-ping" />
                                        In Video Dock
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-[11px] text-[var(--ink-muted)] truncate hidden sm:block mt-0.5">
                                    {session.objective}
                                  </div>
                                </div>
                              </div>

                              {/* Right: Duration mono + Difficulty tag + Video indicator */}
                              <div className="flex items-center gap-2.5 flex-shrink-0 text-xs">
                                {session.video && (
                                  <span
                                    className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono rounded-md bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink)]"
                                    title={`Video: ${session.video.title}`}
                                  >
                                    <Play className="w-2.5 h-2.5 fill-[var(--accent)] text-[var(--accent)]" />
                                    <span>{session.video.duration}</span>
                                  </span>
                                )}
                                <span className="font-mono text-[var(--ink-muted)] text-[11px] tabular-nums">
                                  {session.estimated_minutes}m
                                </span>
                                <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-mono rounded bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink-muted)]">
                                  {session.difficulty}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Phase Project Milestone Card */}
                  {phase.project && (
                    <div className="p-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-[var(--warn)] stroke-[1.5]" />
                          <h3 className="font-serif text-sm font-medium text-[var(--ink)]">
                            {phase.project.title}
                          </h3>
                        </div>
                        <button
                          onClick={() => handleTogglePhaseProject(phase.id)}
                          className={`text-xs px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                            progress.projectCompletedPhases.includes(phase.id)
                              ? "bg-[var(--accent)] text-white border-[var(--accent)] font-medium"
                              : "border-[var(--line)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--accent)]"
                          }`}
                        >
                          {progress.projectCompletedPhases.includes(phase.id)
                            ? "Project Completed"
                            : "Mark Milestone Done"}
                        </button>
                      </div>

                      <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                        {phase.project.brief}
                      </p>

                      {/* Acceptance Criteria */}
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
                          Acceptance Criteria
                        </div>
                        <ul className="space-y-1 text-xs text-[var(--ink)]">
                          {phase.project.acceptance_criteria.map((c, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-[var(--accent)]">•</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Stretch Goal */}
                      {phase.project.stretch && (
                        <div className="pt-2 text-[11px] text-[var(--ink-muted)] italic">
                          <strong className="not-italic text-[var(--ink)]">Stretch: </strong>
                          {phase.project.stretch}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </main>

        {/* 3. Desktop Right Rail: THE VIDEO DOCK (Sticky at top-28, stays pinned in view as you scroll) */}
        {activeSession && (
          <aside className="hidden md:flex flex-col w-80 lg:w-[420px] xl:w-[460px] flex-shrink-0 sticky top-28 self-start h-[calc(100vh-8.5rem)] max-h-[calc(100vh-8.5rem)] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-xl">
            <SessionDetail
              key={activeSession.id}
              session={activeSession}
              phaseNumber={activeSessionContext?.phaseNumber}
              phaseTitle={activeSessionContext?.phaseTitle}
              weekNumber={activeSessionContext?.weekNumber}
              weekTheme={activeSessionContext?.weekTheme}
              sessionIndex={activeSessionContext?.sessionIndex}
              isCompleted={progress.completedSessionIds.includes(activeSession.id)}
              onToggleComplete={() => handleToggleSessionComplete(activeSession.id)}
              onClose={() => setSelectedSessionId(null)}
              onFeedback={handleFeedback}
              savedAnswers={progress.checkpointAnswers[activeSession.id] || []}
              onSaveAnswer={handleSaveAnswer}
              onUpdateSession={handleUpdateSession}
              planGoal={plan.intake?.goal || plan.title}
              planSpeciality={plan.intake?.speciality || ""}
              isDemo={isDemo}
            />
          </aside>
        )}

        {/* 4. Mobile Bottom Sheet */}
        {activeSession && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-[1px]"
              onClick={() => setSelectedSessionId(null)}
            />
            <div className="relative bg-[var(--surface)] border-t border-[var(--line)] rounded-t-2xl h-[85vh] max-h-[85vh] flex flex-col z-10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
              <div className="w-10 h-1 bg-[var(--line)] rounded-full mx-auto my-2.5 flex-shrink-0" />
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <SessionDetail
                  key={activeSession.id}
                  session={activeSession}
                  phaseNumber={activeSessionContext?.phaseNumber}
                  phaseTitle={activeSessionContext?.phaseTitle}
                  weekNumber={activeSessionContext?.weekNumber}
                  weekTheme={activeSessionContext?.weekTheme}
                  sessionIndex={activeSessionContext?.sessionIndex}
                  isCompleted={progress.completedSessionIds.includes(activeSession.id)}
                  onToggleComplete={() => handleToggleSessionComplete(activeSession.id)}
                  onClose={() => setSelectedSessionId(null)}
                  onFeedback={handleFeedback}
                  savedAnswers={progress.checkpointAnswers[activeSession.id] || []}
                  onSaveAnswer={handleSaveAnswer}
                  onUpdateSession={handleUpdateSession}
                  planGoal={plan.intake?.goal || plan.title}
                  planSpeciality={plan.intake?.speciality || ""}
                  isDemo={isDemo}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Adaptive Replan Diff Modal */}
      <ReplanDiffModal
        patch={replanPatch}
        isOpen={isReplanModalOpen}
        onClose={() => setIsReplanModalOpen(false)}
        onAccept={handleAcceptReplan}
        isDemo={isDemo}
      />
    </div>
  );
}
