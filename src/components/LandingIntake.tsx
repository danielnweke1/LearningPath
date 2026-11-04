"use client";

import { useState } from "react";
import {
  IntakeInput,
  GrowthIntent,
  SkillLevel,
  LearningStyle,
} from "@/types/plan";
import { DEMO_PLANS, DemoItem } from "@/lib/demos";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Clock,
  Calendar,
  HelpCircle,
  BookOpen,
  CheckCircle,
} from "lucide-react";

interface LandingIntakeProps {
  onSubmit: (input: IntakeInput) => void;
  onSelectDemo: (demo: DemoItem) => void;
  onOpenDiagnostic: (currentTopic: string) => void;
  diagnosticVerdict?: { level: SkillLevel; reason: string; score: number } | null;
  isSubmitting?: boolean;
  initialGoal?: string;
  onBackToHome?: () => void;
}

const GROWTH_INTENTS: GrowthIntent[] = [
  "Start from zero",
  "Level up in current area",
  "Switch fields",
  "Prepare for a role or exam",
  "Go deeper on a niche",
];

const SKILL_LEVELS: SkillLevel[] = [
  "Beginner",
  "Some experience",
  "Intermediate",
  "Advanced",
];

const LEARNING_STYLES: LearningStyle[] = [
  "Video-first",
  "Hands-on projects",
  "Reading",
  "Mixed",
];

export function LandingIntake({
  onSubmit,
  onSelectDemo,
  onOpenDiagnostic,
  diagnosticVerdict,
  isSubmitting = false,
  initialGoal = "",
  onBackToHome,
}: LandingIntakeProps) {
  const [goal, setGoal] = useState(initialGoal);
  const [speciality, setSpeciality] = useState("");
  const [growthIntent, setGrowthIntent] = useState<GrowthIntent>("Level up in current area");
  const [currentLevel, setCurrentLevel] = useState<SkillLevel>(
    diagnosticVerdict ? diagnosticVerdict.level : "Intermediate"
  );
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(6);
  const [targetWeeks, setTargetWeeks] = useState<number>(8);
  const [learningStyle, setLearningStyle] = useState<LearningStyle[]>([
    "Video-first",
    "Hands-on projects",
  ]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const toggleStyle = (style: LearningStyle) => {
    if (learningStyle.includes(style)) {
      if (learningStyle.length > 1) {
        setLearningStyle(learningStyle.filter((s) => s !== style));
      }
    } else {
      setLearningStyle([...learningStyle, style]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || goal.trim().length < 3) {
      setValidationError("Please specify what you want to learn or become.");
      return;
    }
    setValidationError(null);

    onSubmit({
      goal: goal.trim(),
      speciality: speciality.trim(),
      growthIntent,
      currentLevel: diagnosticVerdict ? diagnosticVerdict.level : currentLevel,
      hoursPerWeek,
      targetWeeks,
      learningStyle,
      diagnosticResult: diagnosticVerdict || undefined,
    });
  };

  const totalHours = hoursPerWeek * targetWeeks;
  const estSessions = Math.round((totalHours * 60) / 45);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {onBackToHome && (
        <button
          onClick={onBackToHome}
          className="mb-6 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Back to Home</span>
        </button>
      )}

      {/* 1. Value proposition */}
      <div className="mb-10 max-w-3xl">
        <div className="text-xs font-mono uppercase tracking-widest text-[var(--ink-muted)] mb-3">
          Curriculum Architect
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[var(--ink)] leading-[1.15] mb-4">
          Configure your tailored study roadmap.
        </h1>
        <p className="text-base text-[var(--ink-muted)] leading-relaxed max-w-2xl">
          Define your target competency, schedule, and current depth. LearningPath produces a
          rigorous weekly curriculum attached to verified YouTube lectures, milestone projects, and
          comprehension checkpoints.
        </p>
      </div>

      {/* 2. Intake Form + Live Request Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        {/* Intake Form (Left 8 cols) */}
        <div className="lg:col-span-8 bg-[var(--surface)] border border-[var(--line)] rounded-xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Goal Input */}
            <div>
              <label
                htmlFor="goal-input"
                className="block text-sm font-medium text-[var(--ink)] mb-1.5"
              >
                Goal <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                id="goal-input"
                type="text"
                value={goal}
                onChange={(e) => {
                  setGoal(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="What do you want to learn or become? e.g. Distributed systems engineer"
                className="w-full px-3.5 py-2.5 rounded-md border border-[var(--line)] bg-[var(--bg)] text-sm text-[var(--ink)] placeholder-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent)]"
                required
              />
              <span className="text-[11px] text-[var(--ink-muted)] mt-1 block">
                Be specific: mention target technologies, disciplines, or job titles.
              </span>
              {validationError && (
                <div className="text-xs text-[var(--danger)] mt-1.5">{validationError}</div>
              )}
            </div>

            {/* Speciality / Context */}
            <div>
              <label
                htmlFor="speciality-input"
                className="block text-sm font-medium text-[var(--ink)] mb-1.5"
              >
                Area of Speciality / Context{" "}
                <span className="text-[var(--ink-muted)] font-normal text-xs">(optional)</span>
              </label>
              <input
                id="speciality-input"
                type="text"
                value={speciality}
                onChange={(e) => setSpeciality(e.target.value)}
                placeholder="e.g. Coming from backend TypeScript, focusing on high-throughput microservices"
                className="w-full px-3.5 py-2.5 rounded-md border border-[var(--line)] bg-[var(--bg)] text-sm text-[var(--ink)] placeholder-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            {/* Two Column Group: Growth Intent & Current Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">
                  Growth Intent
                </label>
                <select
                  value={growthIntent}
                  onChange={(e) => setGrowthIntent(e.target.value as GrowthIntent)}
                  className="w-full px-3.5 py-2.5 rounded-md border border-[var(--line)] bg-[var(--bg)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                >
                  {GROWTH_INTENTS.map((intent) => (
                    <option key={intent} value={intent}>
                      {intent}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-[var(--ink)]">
                    Current Level
                  </label>
                  <button
                    type="button"
                    onClick={() => onOpenDiagnostic(goal || "Software Engineering")}
                    className="text-[11px] text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <HelpCircle className="w-3 h-3 stroke-[1.5]" />
                    Not sure, test me
                  </button>
                </div>
                {diagnosticVerdict ? (
                  <div className="px-3.5 py-2 rounded-md border border-[var(--accent)] bg-[var(--accent-soft)] flex items-center justify-between text-xs">
                    <span className="font-medium text-[var(--ink)]">
                      Diagnosed: {diagnosticVerdict.level} ({diagnosticVerdict.score}/5)
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenDiagnostic(goal || "Software Engineering")}
                      className="text-[10px] text-[var(--accent)] underline"
                    >
                      Retest
                    </button>
                  </div>
                ) : (
                  <select
                    value={currentLevel}
                    onChange={(e) => setCurrentLevel(e.target.value as SkillLevel)}
                    className="w-full px-3.5 py-2.5 rounded-md border border-[var(--line)] bg-[var(--bg)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    {SKILL_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Hours per week & Target weeks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">
                  Hours per Week:{" "}
                  <span className="font-mono text-[var(--accent)] font-semibold">
                    {hoursPerWeek} hrs
                  </span>
                </label>
                <input
                  type="range"
                  min={2}
                  max={25}
                  step={1}
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(parseInt(e.target.value, 10))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-[var(--ink-muted)] font-mono mt-1">
                  <span>2 hrs (casual)</span>
                  <span>10 hrs</span>
                  <span>25 hrs (immersive)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">
                  Target Duration:{" "}
                  <span className="font-mono text-[var(--accent)] font-semibold">
                    {targetWeeks} weeks
                  </span>
                </label>
                <input
                  type="range"
                  min={2}
                  max={24}
                  step={1}
                  value={targetWeeks}
                  onChange={(e) => setTargetWeeks(parseInt(e.target.value, 10))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-[var(--ink-muted)] font-mono mt-1">
                  <span>2 weeks (sprint)</span>
                  <span>8 weeks</span>
                  <span>24 weeks</span>
                </div>
              </div>
            </div>

            {/* Learning Style Multi-Select */}
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">
                Learning Style Preferences
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {LEARNING_STYLES.map((style) => {
                  const active = learningStyle.includes(style);
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleStyle(style)}
                      className={`px-3 py-2 text-xs rounded-md border text-center transition-colors font-medium ${
                        active
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)]"
                          : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {style}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-md bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? "Synthesizing Roadmap..." : "Generate Custom Learning Path"}
                <ArrowRight className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>
          </form>
        </div>

        {/* Live Summary Card (Right 4 cols) */}
        <div className="lg:col-span-4 bg-[var(--surface-2)] border border-[var(--line)] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[var(--ink-muted)] mb-3">
              Plan Specification Summary
            </div>
            <h3 className="font-serif text-lg text-[var(--ink)] mb-3">
              {goal ? goal : "Your Target Competency"}
            </h3>

            <div className="space-y-3 text-xs text-[var(--ink)]">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                <span className="text-[var(--ink-muted)]">Starting Level</span>
                <span className="font-medium">
                  {diagnosticVerdict ? diagnosticVerdict.level : currentLevel}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                <span className="text-[var(--ink-muted)]">Total Time Budget</span>
                <span className="font-mono">{totalHours} total hours</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                <span className="text-[var(--ink-muted)]">Est. Sessions</span>
                <span className="font-mono">~{estSessions} sessions</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                <span className="text-[var(--ink-muted)]">Weekly Rhythm</span>
                <span className="font-mono">{hoursPerWeek} hrs/week over {targetWeeks} wks</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-muted)]">Approach</span>
                <span className="capitalize">{growthIntent.toLowerCase()}</span>
              </div>
            </div>

            <div className="mt-6 p-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[11px] text-[var(--ink-muted)] leading-relaxed">
              Sessions are sequenced by prerequisite dependency. Real YouTube lectures will be
              curated and scored for Week 1 and Week 2, with subsequent weeks lazy-loaded upon progression.
            </div>
          </div>

          <div className="pt-6 border-t border-[var(--line)] mt-6 text-[11px] text-[var(--ink-muted)] font-mono">
            Zero hallucinated URLs · 100% verified videos
          </div>
        </div>
      </div>

      {/* 3. Demo Mode Section */}
      <div className="pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-serif text-[var(--ink)]">Pre-computed Demo Roadmaps</h2>
            <p className="text-xs text-[var(--ink-muted)]">
              Explore fully interactive plans loaded instantly with zero API latency.
            </p>
          </div>
        </div>

        {/* Demo Table */}
        <div className="overflow-x-auto border border-[var(--line)] rounded-xl bg-[var(--surface)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink-muted)] font-mono">
                <th className="py-3 px-4 font-normal">TOPIC & FOCUS</th>
                <th className="py-3 px-4 font-normal">LEVEL</th>
                <th className="py-3 px-4 font-normal">DURATION</th>
                <th className="py-3 px-4 font-normal">WEEKLY COMMITMENT</th>
                <th className="py-3 px-4 font-normal text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {DEMO_PLANS.map((demo) => (
                <tr
                  key={demo.id}
                  className="hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                  onClick={() => onSelectDemo(demo)}
                >
                  <td className="py-3 px-4">
                    <div className="font-medium text-sm text-[var(--ink)] font-serif">
                      {demo.topic}
                    </div>
                    <div className="text-[11px] text-[var(--ink-muted)]">
                      {demo.plan.summary.slice(0, 75)}...
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--surface-2)] border border-[var(--line)]">
                      {demo.level}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">{demo.weeks} weeks</td>
                  <td className="py-3 px-4 font-mono">{demo.hoursPerWeek} hrs/week</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDemo(demo);
                      }}
                      className="px-3 py-1.5 rounded-md border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--accent)] hover:text-white transition-colors text-xs font-medium"
                    >
                      Load Demo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
