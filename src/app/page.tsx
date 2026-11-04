"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Plan,
  PlanProgress,
  IntakeInput,
  SkillLevel,
  Session,
} from "@/types/plan";
import { Header } from "@/components/Header";
import { HomePage } from "@/components/HomePage";
import { LandingIntake } from "@/components/LandingIntake";
import { PlanRoadmap } from "@/components/PlanRoadmap";
import { GenerationProgress } from "@/components/GenerationProgress";
import { DiagnosticModal } from "@/components/DiagnosticModal";
import { CommandPalette, ShortcutsModal } from "@/components/CommandPalette";
import { ExportModal } from "@/components/ExportModal";
import { planStorage } from "@/lib/storage";
import { DemoItem } from "@/lib/demos";
import { AlertCircle } from "lucide-react";

export default function Home() {
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [view, setView] = useState<"home" | "intake" | "roadmap">("home");
  const [initialGoalForIntake, setInitialGoalForIntake] = useState<string>("");

  const [progress, setProgress] = useState<PlanProgress>({
    planId: "",
    completedSessionIds: [],
    sessionFeedback: {},
    checkpointAnswers: {},
    projectCompletedPhases: [],
    currentWeekNumber: 1,
    streakDays: 1,
    startedAt: "",
    lastActiveAt: "",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationParams, setGenerationParams] = useState<{
    goal: string;
    targetWeeks: number;
    hoursPerWeek: number;
  }>({
    goal: "",
    targetWeeks: 8,
    hoursPerWeek: 6,
  });

  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [diagnosticTopic, setDiagnosticTopic] = useState("");
  const [diagnosticVerdict, setDiagnosticVerdict] = useState<{
    level: SkillLevel;
    reason: string;
    score: number;
  } | null>(null);

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load existing plan from localStorage on startup
  useEffect(() => {
    async function initStorage() {
      const activeId = planStorage.getActivePlanId();
      if (activeId) {
        const storedPlan = await planStorage.getPlan(activeId);
        if (storedPlan) {
          setActivePlan(storedPlan);
          const p = await planStorage.getProgress(activeId);
          setProgress(p);
        }
      }
    }
    initStorage();
  }, []);

  // Compute total sessions
  const totalSessions = useMemo(() => {
    if (!activePlan) return 0;
    let count = 0;
    for (const phase of activePlan.phases) {
      for (const week of phase.weeks) {
        count += week.sessions.length;
      }
    }
    return count;
  }, [activePlan]);

  const handleUpdateProgress = async (newProgress: PlanProgress) => {
    setProgress(newProgress);
    await planStorage.saveProgress(newProgress);
  };

  const handleUpdatePlan = async (newPlan: Plan) => {
    setActivePlan(newPlan);
    await planStorage.savePlan(newPlan);
  };

  const handleSelectDemo = async (demo: DemoItem) => {
    setErrorMessage(null);
    const demoPlan = demo.plan;
    await planStorage.savePlan(demoPlan);
    const initialProgress: PlanProgress = {
      planId: demoPlan.id,
      completedSessionIds: [],
      sessionFeedback: {},
      checkpointAnswers: {},
      projectCompletedPhases: [],
      currentWeekNumber: 1,
      streakDays: 1,
      startedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };
    await planStorage.saveProgress(initialProgress);
    setActivePlan(demoPlan);
    setProgress(initialProgress);
    setView("roadmap");
  };

  const handleStartCustomGeneration = async (input: IntakeInput) => {
    setErrorMessage(null);
    setIsGenerating(true);
    setGenerationParams({
      goal: input.goal,
      targetWeeks: input.targetWeeks,
      hoursPerWeek: input.hoursPerWeek,
    });

    try {
      const res = await fetch("/api/plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await res.json();

      const errorMsg = data.refusal || data.error || (!res.ok ? "Failed to generate learning path." : null);
      if (errorMsg) {
        throw new Error(errorMsg);
      }

      if (data.clarifying_question) {
        throw new Error(
          `Please provide more detail: ${data.clarifying_question}`
        );
      }

      if (data.plan) {
        await planStorage.savePlan(data.plan);
        const newProgress: PlanProgress = {
          planId: data.plan.id,
          completedSessionIds: [],
          sessionFeedback: {},
          checkpointAnswers: {},
          projectCompletedPhases: [],
          currentWeekNumber: 1,
          streakDays: 1,
          startedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        };
        await planStorage.saveProgress(newProgress);
        setActivePlan(data.plan);
        setProgress(newProgress);
        setView("roadmap");
      }
    } catch (err: any) {
      console.warn("Generation notice:", err?.message || err);
      setErrorMessage(err.message || "Failed to generate plan. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewPlan = () => {
    setInitialGoalForIntake("");
    setView("intake");
    setErrorMessage(null);
  };

  const handleGoHome = () => {
    setView("home");
    setErrorMessage(null);
  };

  const handleResumePlan = () => {
    if (activePlan) {
      setView("roadmap");
    }
  };

  const handleSelectSessionFromCommand = (session: Session) => {
    // If command palette selects a session, jump to roadmap
    if (activePlan) {
      setView("roadmap");
    }
    setIsCommandPaletteOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--ink)]">
      {/* Persistent Header */}
      <Header
        plan={activePlan}
        totalSessions={totalSessions}
        completedSessionsCount={progress.completedSessionIds.length}
        streakDays={progress.streakDays}
        onGoHome={handleGoHome}
        onNewPlan={handleNewPlan}
        onResumePlan={handleResumePlan}
        isViewingHome={view === "home"}
        hasActivePlan={!!activePlan}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        isDemo={activePlan?.isDemo}
      />

      {/* Error alert if any */}
      {errorMessage && (
        <div className="max-w-4xl mx-auto px-4 mt-4 w-full">
          <div className="p-4 rounded-xl border border-[var(--danger)] bg-[var(--danger-soft)] text-xs text-[var(--danger)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="px-2.5 py-1 text-[11px] rounded border border-[var(--danger)] hover:opacity-80 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main View Router */}
      {isGenerating ? (
        <GenerationProgress
          goal={generationParams.goal}
          targetWeeks={generationParams.targetWeeks}
          hoursPerWeek={generationParams.hoursPerWeek}
        />
      ) : view === "roadmap" && activePlan ? (
        <PlanRoadmap
          plan={activePlan}
          progress={progress}
          onUpdateProgress={handleUpdateProgress}
          onUpdatePlan={handleUpdatePlan}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          isDemo={activePlan.isDemo}
        />
      ) : view === "intake" ? (
        <LandingIntake
          onSubmit={handleStartCustomGeneration}
          onSelectDemo={handleSelectDemo}
          onOpenDiagnostic={(topic) => {
            setDiagnosticTopic(topic);
            setIsDiagnosticOpen(true);
          }}
          diagnosticVerdict={diagnosticVerdict}
          isSubmitting={isGenerating}
          initialGoal={initialGoalForIntake}
          onBackToHome={handleGoHome}
        />
      ) : (
        <HomePage
          activePlan={activePlan}
          progress={progress}
          onResumePlan={handleResumePlan}
          onStartCustom={(initialGoal) => {
            setInitialGoalForIntake(initialGoal || "");
            setView("intake");
          }}
          onSelectDemo={handleSelectDemo}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />
      )}

      {/* Diagnostic Modal */}
      <DiagnosticModal
        topic={diagnosticTopic || "Software Engineering"}
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        onApplyVerdict={(verdict, reason, score) => {
          setDiagnosticVerdict({ level: verdict, reason, score });
        }}
      />

      {/* Command Palette */}
      <CommandPalette
        plan={activePlan}
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectSession={handleSelectSessionFromCommand}
        completedSessionIds={progress.completedSessionIds}
      />

      {/* Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Export Modal */}
      {activePlan && (
        <ExportModal
          plan={activePlan}
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          onImportSuccess={(imported) => {
            setActivePlan(imported);
          }}
        />
      )}
    </div>
  );
}
