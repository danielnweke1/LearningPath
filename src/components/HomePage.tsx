"use client";

import { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Play,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  Compass,
  Cpu,
  Database,
  Music,
  Globe,
  Palette,
  Terminal,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Plan, PlanProgress } from "@/types/plan";
import { DemoItem, DEMO_PLANS } from "@/lib/demos";

interface HomePageProps {
  activePlan: Plan | null;
  progress: PlanProgress;
  onResumePlan: () => void;
  onStartCustom: (initialGoal?: string) => void;
  onSelectDemo: (demo: DemoItem) => void;
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
}

interface CuratedTrack {
  id: string;
  title: string;
  category: string;
  icon: any;
  level: string;
  duration: string;
  weeklyCommitment: string;
  description: string;
  goal: string;
  speciality: string;
}

const FEATURED_TRACKS: CuratedTrack[] = [
  {
    id: "sql_databases",
    title: "SQL & Relational Databases",
    category: "Databases & Backend",
    icon: Database,
    level: "Beginner",
    duration: "6 weeks",
    weeklyCommitment: "6 hrs/week",
    description: "From relational invariants and multi-table joins to B-Tree indexing, execution plans, and ACID transactions.",
    goal: "Learn SQL & Relational Databases",
    speciality: "Relational queries, schema design, and query optimization",
  },
  {
    id: "nextjs_react",
    title: "Full-Stack Web Development & Next.js",
    category: "Frontend & Fullstack",
    icon: Terminal,
    level: "Intermediate",
    duration: "8 weeks",
    weeklyCommitment: "8 hrs/week",
    description: "Component architecture, React Server Components, server actions, route handlers, and production deployment.",
    goal: "Full-Stack Web Development with Next.js",
    speciality: "Next.js App Router, TypeScript, and Server Actions",
  },
  {
    id: "acoustic_guitar",
    title: "Acoustic Guitar Mastery",
    category: "Music & Instruments",
    icon: Music,
    level: "Beginner",
    duration: "6 weeks",
    weeklyCommitment: "5 hrs/week",
    description: "Fretboard ergonomics, open chords, rapid transitions, rhythm subdivisions, and fingerpicking patterns.",
    goal: "Learn Acoustic Guitar",
    speciality: "Fingerpicking, rhythm strumming, and chord progressions",
  },
  {
    id: "conversational_spanish",
    title: "Conversational Spanish Fluency",
    category: "Foreign Languages",
    icon: Globe,
    level: "Beginner",
    duration: "6 weeks",
    weeklyCommitment: "6 hrs/week",
    description: "Phonetic vowels, core sentence mechanics, narrative timeframes, and spontaneous natural dialogue.",
    goal: "Learn Conversational Spanish",
    speciality: "Pronunciation, listening comprehension, and daily conversation",
  },
  {
    id: "python_data_science",
    title: "Python for Data Science & AI",
    category: "Data & Machine Learning",
    icon: Cpu,
    level: "Intermediate",
    duration: "8 weeks",
    weeklyCommitment: "6 hrs/week",
    description: "NumPy vectorization, Pandas data wrangling, statistical modeling, Scikit-Learn, and PyTorch deep learning.",
    goal: "Python for Data Science and Machine Learning",
    speciality: "Pandas, Scikit-Learn, and PyTorch neural networks",
  },
  {
    id: "figma_product_design",
    title: "UI/UX & Product Design with Figma",
    category: "Design & Product",
    icon: Palette,
    level: "Intermediate",
    duration: "8 weeks",
    weeklyCommitment: "6 hrs/week",
    description: "Visual hierarchy, 8pt spatial systems, Figma auto-layout, interactive variants, and design systems handoff.",
    goal: "UI/UX Product Design with Figma",
    speciality: "Design systems, interactive prototypes, and usability testing",
  },
];

export function HomePage({
  activePlan,
  progress,
  onResumePlan,
  onStartCustom,
  onSelectDemo,
  onOpenCommandPalette,
  onOpenShortcuts,
}: HomePageProps) {
  const [quickGoal, setQuickGoal] = useState("");

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartCustom(quickGoal.trim());
  };

  const handleSelectQuickPill = (topic: string) => {
    onStartCustom(topic);
  };

  const completedCount = progress?.completedSessionIds?.length || 0;
  let totalSessions = 0;
  if (activePlan) {
    for (const phase of activePlan.phases) {
      for (const week of phase.weeks) {
        totalSessions += week.sessions.length;
      }
    }
  }
  const progressPercent = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0;

  return (
    <div className="w-full flex flex-col bg-[var(--bg)] text-[var(--ink)]">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-[var(--line)]">
        {/* Subtle decorative background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--surface-2)]/60 via-transparent to-transparent pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Subtle announcement badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--line)] bg-[var(--surface)] shadow-2xs mb-6 text-xs text-[var(--ink-muted)]">
            <span className="flex h-2 w-2 rounded-full bg-[var(--accent)]" />
            <span className="font-mono text-[11px] font-medium text-[var(--ink)]">
              GPT-4o Architecture · Vetted Video Anchoring
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[var(--ink)] tracking-tight leading-[1.12] max-w-4xl mx-auto mb-6">
            Master any discipline with structured, video-anchored roadmaps.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[var(--ink-muted)] max-w-2xl mx-auto leading-relaxed mb-10">
            From zero to production fluency. LearningPath synthesizes chronological weekly curricula,
            pairs every concept with vetted video lectures from world-class educators, and crafts interactive theory treatises.
          </p>

          {/* Interactive Search & Quick Start Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <form onSubmit={handleQuickSubmit} className="relative flex items-center shadow-lg rounded-2xl overflow-hidden border border-[var(--line)] bg-[var(--surface)] p-1.5 focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-soft)] transition-all">
              <div className="pl-3.5 pr-2 text-[var(--ink-muted)]">
                <Search className="w-5 h-5 stroke-[1.5]" />
              </div>
              <input
                type="text"
                value={quickGoal}
                onChange={(e) => setQuickGoal(e.target.value)}
                placeholder="What do you want to learn? e.g. SQL & Databases, Acoustic Guitar, Next.js..."
                className="w-full py-2.5 px-2 bg-transparent text-sm sm:text-base text-[var(--ink)] placeholder-[var(--ink-muted)] focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs sm:text-sm font-medium hover:opacity-95 transition-opacity flex-shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Build Roadmap</span>
                <ArrowRight className="w-4 h-4 stroke-[2]" />
              </button>
            </form>
          </div>

          {/* Popular Quick Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto text-xs">
            <span className="text-[var(--ink-muted)] font-mono text-[11px] mr-1">Popular Tracks:</span>
            {[
              { label: "SQL & Databases", icon: "🗄️" },
              { label: "Next.js Full-Stack", icon: "⚛️" },
              { label: "Acoustic Guitar", icon: "🎸" },
              { label: "Conversational Spanish", icon: "🇪🇸" },
              { label: "Python & Machine Learning", icon: "🐍" },
              { label: "Figma UI/UX Design", icon: "🎨" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => handleSelectQuickPill(item.label)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] hover:border-[var(--accent)] transition-colors text-[var(--ink)] text-xs cursor-pointer shadow-2xs"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Active Roadmap Quick-Resume Card (if user has a plan in progress) */}
      {activePlan && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 relative z-10 w-full mb-12">
          <div className="p-5 sm:p-6 rounded-2xl border border-[var(--accent)] bg-[var(--surface)] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent)]">
                <span className="flex h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
                <span className="font-semibold uppercase tracking-wider">Active Study Roadmap In Progress</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif text-[var(--ink)] font-semibold truncate">
                {activePlan.title}
              </h2>
              <div className="flex items-center gap-3 text-xs text-[var(--ink-muted)]">
                <span>Week {progress.currentWeekNumber || 1} of {activePlan.phases.reduce((acc, p) => acc + p.weeks.length, 0)}</span>
                <span>·</span>
                <span className="font-mono text-[var(--ink)]">{completedCount} of {totalSessions} sessions completed ({progressPercent}%)</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-[var(--line)] rounded-full overflow-hidden max-w-md">
                <div
                  className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={onResumePlan}
                className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-95 transition-opacity inline-flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <span>Resume Learning</span>
                <ArrowRight className="w-4 h-4 stroke-[2]" />
              </button>
              <button
                onClick={() => onStartCustom()}
                className="px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] hover:bg-[var(--line)] text-xs font-medium text-[var(--ink)] transition-colors cursor-pointer"
              >
                Start Another
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 3. The 3 Pillars of LearningPath */}
      <section className="py-16 md:py-20 border-b border-[var(--line)] bg-[var(--surface-2)]/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-mono uppercase tracking-widest text-[var(--ink-muted)] mb-3">
              The LearningPath Standard
            </h2>
            <h3 className="text-2xl sm:text-3xl font-serif text-[var(--ink)] leading-snug">
              Built for deep, demonstrable mastery. Not superficial skimming.
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-2xs space-y-4 hover:border-[var(--accent)]/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                <Layers className="w-5 h-5 stroke-[1.75]" />
              </div>
              <h4 className="text-base font-serif font-bold text-[var(--ink)]">
                Prerequisite Dependency Ordering
              </h4>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                Concepts are chronologically sequenced so advanced techniques always build on mastered invariants. Every phase concludes with a portfolio milestone project.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-2xs space-y-4 hover:border-[var(--accent)]/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                <Play className="w-5 h-5 stroke-[1.75] fill-current" />
              </div>
              <h4 className="text-base font-serif font-bold text-[var(--ink)]">
                Vetted Video Lecture Anchoring
              </h4>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                Zero hallucinated URLs or broken links. Real YouTube tutorials are scored by duration, view-count credibility, and domain relevance from world-class instructors.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-2xs space-y-4 hover:border-[var(--accent)]/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                <Sparkles className="w-5 h-5 stroke-[1.75]" />
              </div>
              <h4 className="text-base font-serif font-bold text-[var(--ink)]">
                GPT-4o Theoretical Treatises
              </h4>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                Deep academic treatises, mental models, common anti-patterns, and interactive multiple-choice checkpoint drills synthesized on-demand for every single session.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Curated Learning Tracks (Interactive Demos & Instant Launch) */}
      <section className="py-16 md:py-20 border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-[var(--ink-muted)] mb-2">
                Curated Blueprints
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif text-[var(--ink)]">
                Explore Popular Learning Tracks
              </h3>
              <p className="text-xs text-[var(--ink-muted)] mt-1">
                Launch instantly with pre-vetted video lectures and full theoretical depth.
              </p>
            </div>

            <button
              onClick={() => onStartCustom()}
              className="text-xs text-[var(--accent)] font-medium hover:underline inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>Build a custom topic instead</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURED_TRACKS.map((track) => {
              const Icon = track.icon;
              return (
                <div
                  key={track.id}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 flex flex-col justify-between hover:border-[var(--accent)]/60 hover:shadow-md transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-[var(--surface-2)] text-[var(--accent)] flex items-center justify-center border border-[var(--line)]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[var(--surface-2)] text-[var(--ink-muted)] border border-[var(--line)]">
                        {track.level}
                      </span>
                    </div>

                    <div>
                      <div className="text-[10px] font-mono text-[var(--ink-muted)] uppercase tracking-wider">
                        {track.category}
                      </div>
                      <h4 className="text-base font-serif font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors mt-0.5">
                        {track.title}
                      </h4>
                    </div>

                    <p className="text-xs text-[var(--ink-muted)] leading-relaxed line-clamp-3">
                      {track.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[var(--line)] space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ink-muted)]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {track.duration}
                      </span>
                      <span>{track.weeklyCommitment}</span>
                    </div>

                    <button
                      onClick={() => onStartCustom(track.goal)}
                      className="w-full py-2 px-3 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--accent)] hover:text-white text-xs font-medium text-[var(--ink)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Start Roadmap</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Pre-computed Instant Demos */}
      <section className="py-14 md:py-16 border-b border-[var(--line)] bg-[var(--surface-2)]/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h3 className="text-xl sm:text-2xl font-serif text-[var(--ink)] mb-2">
              Instant Pre-Computed Demos
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              Loaded instantly from disk with zero API latency to preview the interactive experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {DEMO_PLANS.map((demo) => (
              <div
                key={demo.id}
                onClick={() => onSelectDemo(demo)}
                className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)] cursor-pointer transition-all hover:shadow-xs group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[var(--accent)] uppercase font-semibold">Instant Demo</span>
                  <span className="text-[10px] font-mono text-[var(--ink-muted)]">{demo.weeks} wks</span>
                </div>
                <h4 className="text-sm font-serif font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors leading-snug">
                  {demo.topic}
                </h4>
                <div className="text-[11px] text-[var(--ink-muted)] line-clamp-2">
                  {demo.plan.summary}
                </div>
                <div className="pt-2 flex items-center justify-between text-[11px] font-medium text-[var(--accent)]">
                  <span>Explore Demo</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="py-8 bg-[var(--surface)] text-xs text-[var(--ink-muted)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[var(--accent)] text-white flex items-center justify-center font-serif text-xs font-bold">
              L
            </div>
            <span className="font-serif font-medium text-[var(--ink)]">LearningPath</span>
            <span className="text-[var(--ink-muted)]">· Structured Mastery Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <button
              onClick={onOpenShortcuts}
              className="hover:text-[var(--ink)] underline cursor-pointer"
            >
              Shortcuts (?)
            </button>
            <button
              onClick={onOpenCommandPalette}
              className="hover:text-[var(--ink)] underline cursor-pointer"
            >
              Command Palette (Cmd+K)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

