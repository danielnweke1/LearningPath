"use client";

import { useState, useEffect, useRef } from "react";
import {
  Session,
  CheckpointQuestion,
  VideoRecommendation,
  TheoreticalDiscourse,
} from "@/types/plan";
import {
  X,
  Play,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  Clock,
  ThumbsUp,
  Sliders,
  Check,
  BookOpen,
  Sparkles,
  Copy,
  Code2,
  Terminal,
  BrainCircuit,
  Scale,
  RotateCcw,
  Layers,
  ArrowRight,
  Info,
  ShieldAlert,
  FileText,
} from "lucide-react";

interface SessionDetailProps {
  session: Session;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onClose: () => void;
  onFeedback: (type: "too_easy" | "too_hard" | "stuck") => void;
  savedAnswers?: { questionId: string; selectedIndex: number; isCorrect: boolean }[];
  onSaveAnswer?: (questionId: string, selectedIndex: number, isCorrect: boolean) => void;
  onUpdateSession?: (updatedSession: Session) => void;
  planGoal?: string;
  planSpeciality?: string;
  isDemo?: boolean;
  phaseNumber?: number;
  phaseTitle?: string;
  weekNumber?: number;
  weekTheme?: string;
  sessionIndex?: number;
}

export function SessionDetail({
  session,
  isCompleted,
  onToggleComplete,
  onClose,
  onFeedback,
  savedAnswers = [],
  onSaveAnswer,
  onUpdateSession,
  planGoal = "Mastering Engineering Systems",
  planSpeciality = "",
  isDemo = false,
  phaseNumber,
  phaseTitle,
  weekNumber,
  weekTheme,
  sessionIndex,
}: SessionDetailProps) {
  const [activeTab, setActiveTab] = useState<"discourse" | "lecture" | "quiz">("discourse");
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [showAlternate, setShowAlternate] = useState(false);
  const [isVideoCollapsed, setIsVideoCollapsed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Checkpoints state
  const [currentCheckpointIdx, setCurrentCheckpointIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [submittedCheckpoints, setSubmittedCheckpoints] = useState<Record<string, boolean>>({});

  // Discourse / Theory generation state
  const [isGeneratingDiscourse, setIsGeneratingDiscourse] = useState(false);
  const [discourseError, setDiscourseError] = useState<string | null>(null);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);

  // Forward wheel events anywhere over the top pane (video, tabs, header) to the scrollable content
  const handleWheelForward = (e: React.WheelEvent) => {
    if (contentRef.current) {
      contentRef.current.scrollTop += e.deltaY;
    }
  };

  const checkpoints = session.checkpoints || [];
  const currentCheckpoint: CheckpointQuestion | undefined = checkpoints[currentCheckpointIdx];

  const activeVideo = showAlternate && session.alternate_video
    ? session.alternate_video
    : session.video;

  // Auto-generate discourse on mount if not already present, debounced by 500ms
  useEffect(() => {
    if (session.theory || isGeneratingDiscourse || !onUpdateSession) return;

    const timer = setTimeout(() => {
      handleFetchDiscourse(false);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [session.id, session.theory]);

  const handleFetchDiscourse = async (force = false) => {
    if (session.theory && !force) return;

    setIsGeneratingDiscourse(true);
    setDiscourseError(null);

    try {
      const res = await fetch("/api/plan/discourse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionTitle: session.title,
          objective: session.objective,
          concepts: session.concepts,
          difficulty: session.difficulty,
          goal: planGoal,
          speciality: planSpeciality,
          weekTheme: weekTheme || "",
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.discourse && onUpdateSession) {
        const updated: Session = {
          ...session,
          theory: data.discourse as TheoreticalDiscourse,
        };
        onUpdateSession(updated);
      }
    } catch (err: any) {
      console.warn("Discourse fetch failed:", err);
      setDiscourseError("Unable to synthesize theoretical discourse. You can retry with GPT-4o below.");
    } finally {
      setIsGeneratingDiscourse(false);
    }
  };

  const handleCopyCode = (code: string, idx: number) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (submittedCheckpoints[questionId]) return;
    setSelectedOptions((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmitQuestion = (q: CheckpointQuestion) => {
    const selected = selectedOptions[q.id];
    if (selected === undefined) return;

    setSubmittedCheckpoints((prev) => ({ ...prev, [q.id]: true }));
    const isCorrect = selected === q.correctIndex;
    if (onSaveAnswer) {
      onSaveAnswer(q.id, selected, isCorrect);
    }
  };

  const theory = session.theory;

  return (
    <div className="h-full w-full flex flex-col min-h-0 bg-[var(--surface)] select-text overflow-hidden">
      {/* 1. Phase, Week & Session Breadcrumb Header */}
      <div
        onWheel={handleWheelForward}
        className="px-4 py-2.5 border-b border-[var(--line)] bg-[var(--surface-2)]/50 flex-shrink-0 space-y-1"
      >
        <div className="flex items-center justify-between gap-2">
          {/* Breadcrumb badges */}
          <div className="flex items-center gap-1.5 min-w-0 text-[11px] font-mono">
            <span className="font-semibold text-[var(--accent)] flex-shrink-0">
              Phase {phaseNumber || 1}
            </span>
            <span className="text-[var(--ink-muted)]">/</span>
            <span className="font-medium text-[var(--ink)] flex-shrink-0">
              Week {weekNumber || 1}
            </span>
            {sessionIndex && (
              <>
                <span className="text-[var(--ink-muted)]">/</span>
                <span className="text-[var(--ink-muted)] font-mono flex-shrink-0">
                  Session {sessionIndex}
                </span>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Close session details"
            className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)] transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        {/* Phase / Week theme subtitle */}
        {weekTheme && (
          <p className="text-[11px] text-[var(--ink-muted)] font-mono truncate" title={weekTheme}>
            {weekTheme.replace(/^Week \d+:\s*/, "")}
          </p>
        )}

        {/* Session Title */}
        <h2 className="text-xs sm:text-sm font-semibold text-[var(--ink)] leading-snug line-clamp-2" title={session.title}>
          {session.title}
        </h2>

        {/* Duration, Difficulty & Theory badge */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--ink-muted)] pt-0.5">
          <Clock className="w-3 h-3 stroke-[1.5]" />
          <span>{session.estimated_minutes} min</span>
          <span>·</span>
          <span className="uppercase text-[var(--accent)] font-semibold text-[10px]">
            {session.difficulty}
          </span>
          {theory && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] bg-[var(--accent-soft)] text-[var(--accent)] font-medium">
                <Sparkles className="w-2.5 h-2.5" />
                GPT-4o Theory
              </span>
            </>
          )}
        </div>
      </div>

      {/* 2. Pinned Sticky Video Player Section */}
      <div
        onWheel={handleWheelForward}
        className="p-3 border-b border-[var(--line)] bg-[var(--surface)] flex-shrink-0 shadow-2xs space-y-2"
      >
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-muted)] flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-[var(--ink)] truncate">
              {showAlternate ? "Alternate Vetted Lecture" : "Primary Vetted Lecture"}
            </span>
            {activeVideo?.isFallback && (
              <span className="text-[var(--warn)] text-[10px] font-mono flex-shrink-0">Curated Match</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsVideoCollapsed(!isVideoCollapsed)}
            className="flex items-center gap-1 text-[11px] font-sans font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] px-1.5 py-0.5 rounded transition-colors cursor-pointer flex-shrink-0"
            title={isVideoCollapsed ? "Expand video player" : "Minimize video to focus on notes/theory"}
          >
            {isVideoCollapsed ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="text-[var(--accent)]">Show Video</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Minimize</span>
              </>
            )}
          </button>
        </div>

        {isVideoCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setIsVideoCollapsed(false);
                  setIsPlayingVideo(true);
                }}
                className="w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center flex-shrink-0 shadow-xs hover:opacity-95 cursor-pointer"
                title="Play video"
              >
                <Play className="w-3 h-3 fill-white ml-0.5" />
              </button>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--ink)] truncate">{activeVideo?.title}</p>
                <p className="text-[10px] font-mono text-[var(--ink-muted)] truncate">
                  {activeVideo?.channel} · {activeVideo?.duration}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsVideoCollapsed(false)}
              className="text-xs text-[var(--accent)] hover:underline flex-shrink-0 ml-2 font-medium cursor-pointer"
            >
              Expand
            </button>
          </div>
        ) : activeVideo ? (
          <div className="border border-[var(--line)] rounded-xl overflow-hidden bg-[var(--bg)] shadow-xs">
            {/* Video Thumbnail or Embed Player */}
            <div className="relative aspect-video w-full bg-black">
              {isPlayingVideo && !activeVideo.isFallback ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activeVideo.videoId}?autoplay=1&rel=0`}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <div
                  className="relative w-full h-full cursor-pointer group"
                  onClick={() => {
                    if (activeVideo.isFallback) {
                      window.open(activeVideo.url, "_blank");
                    } else {
                      setIsPlayingVideo(true);
                    }
                  }}
                >
                  <img
                    src={activeVideo.thumbnail}
                    alt={activeVideo.title}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-white/95 text-[var(--ink)] flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
                      <Play className="w-4 h-4 fill-current ml-0.5 text-[var(--accent)]" />
                    </div>
                  </div>
                  {/* Duration badge */}
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[9px] font-mono bg-black/85 text-white rounded font-medium shadow-sm">
                    {activeVideo.duration}
                  </div>
                  {/* Channel tag */}
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 text-[9px] font-sans bg-black/75 text-white/90 rounded backdrop-blur-[2px] truncate max-w-[60%]">
                    {activeVideo.channel}
                  </div>
                </div>
              )}
            </div>

            {/* Video Metadata & Controls */}
            <div className="px-3 py-2 bg-[var(--surface)] flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-medium text-[var(--ink)] truncate leading-tight">
                  {activeVideo.title}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-[var(--ink-muted)] mt-0.5 font-mono">
                  <span>{activeVideo.channel}</span>
                  {activeVideo.views && (
                    <>
                      <span>•</span>
                      <span>{activeVideo.views.toLocaleString()} views</span>
                    </>
                  )}
                </div>
              </div>
              <a
                href={activeVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-2)] flex-shrink-0 transition-colors"
                title="Open video on YouTube"
              >
                <ExternalLink className="w-3.5 h-3.5 stroke-[1.5]" />
              </a>
            </div>
          </div>
        ) : (
          <div className="p-3 border border-[var(--line)] rounded-xl bg-[var(--surface-2)] text-xs text-[var(--ink-muted)] text-center space-y-1.5">
            <p className="text-[11px]">Vetted video for this session is ready.</p>
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(session.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--accent)] transition-colors text-xs font-medium"
            >
              <Play className="w-3 h-3 fill-[var(--accent)] text-[var(--accent)]" />
              Find on YouTube
            </a>
          </div>
        )}

        {/* Primary / Alternate Switcher */}
        {session.alternate_video && (
          <div className="flex items-center justify-between text-[11px] pt-0.5">
            <button
              onClick={() => {
                setShowAlternate(!showAlternate);
                setIsPlayingVideo(false);
              }}
              className="text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-medium text-[11px] cursor-pointer"
            >
              <span>{showAlternate ? "← Switch to Primary Lecture" : "Switch to Alternate Lecture →"}</span>
            </button>
            <span className="text-[10px] text-[var(--ink-muted)] font-mono">2 vetted picks</span>
          </div>
        )}
      </div>

      {/* 3. Sleek Segmented Tab Switcher */}
      <div
        onWheel={handleWheelForward}
        className="px-3 pt-2.5 pb-2 bg-[var(--surface-2)]/50 border-b border-[var(--line)] flex-shrink-0"
      >
        <div className="grid grid-cols-3 gap-1 p-0.5 bg-[var(--surface-2)] rounded-lg border border-[var(--line)]">
          <button
            onClick={() => setActiveTab("discourse")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === "discourse"
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-2xs font-semibold"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="truncate">Theory Treatise</span>
          </button>

          <button
            onClick={() => setActiveTab("lecture")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === "lecture"
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-2xs font-semibold"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            <Play className="w-3 h-3 text-[var(--ink-muted)]" />
            <span className="truncate">Lecture Notes</span>
          </button>

          <button
            onClick={() => setActiveTab("quiz")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === "quiz"
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-2xs font-semibold"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="truncate">Checkpoints ({checkpoints.length})</span>
          </button>
        </div>
      </div>

      {/* 4. Scrollable Tab Content */}
      <div
        ref={contentRef}
        tabIndex={0}
        role="region"
        aria-label="Session details content"
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6 overscroll-contain focus:outline-none"
      >
        {/* ========================================================================= */}
        {/* TAB 1: THEORETICAL DISCOURSE (GPT-4o DEEP DIVE) */}
        {/* ========================================================================= */}
        {activeTab === "discourse" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header / Meta */}
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-[var(--line)]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[var(--accent-soft)] text-[var(--accent)] font-semibold border border-[var(--accent)]/30">
                    <Sparkles className="w-3 h-3" />
                    GPT-4o Theoretical Treatise
                  </span>
                </div>
                <h2 className="text-base font-serif font-medium text-[var(--ink)] leading-snug">
                  {session.title}
                </h2>
              </div>

              <button
                onClick={() => handleFetchDiscourse(true)}
                disabled={isGeneratingDiscourse}
                title="Regenerate deep discourse with GPT-4o"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono rounded-lg border border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0"
              >
                <RotateCcw className={`w-3 h-3 ${isGeneratingDiscourse ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Deepen</span>
              </button>
            </div>

            {/* Loading Shimmer State */}
            {isGeneratingDiscourse && (
              <div className="p-6 rounded-xl border border-[var(--line)] bg-[var(--surface-2)]/60 text-center space-y-4 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)]/20 mx-auto flex items-center justify-center text-[var(--accent)]">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-serif font-medium text-[var(--ink)]">
                    Synthesizing Theoretical Discourse via GPT-4o...
                  </h4>
                  <p className="text-[11px] text-[var(--ink-muted)] max-w-sm mx-auto leading-relaxed">
                    Formulating first-principles invariants, mechanical state transitions, and staff-level architectural trade-offs.
                  </p>
                </div>
                <div className="h-1.5 w-48 bg-[var(--line)] rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-[var(--accent)] rounded-full animate-progress" />
                </div>
              </div>
            )}

            {/* Error fallback state */}
            {discourseError && !isGeneratingDiscourse && (
              <div className="p-3.5 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] text-xs text-[var(--danger)] flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">{discourseError}</p>
                  <button
                    onClick={() => handleFetchDiscourse(true)}
                    className="text-[11px] underline font-medium hover:opacity-80 cursor-pointer"
                  >
                    Click to retry GPT-4o synthesis
                  </button>
                </div>
              </div>
            )}

            {/* Loaded Theory Content */}
            {theory && !isGeneratingDiscourse && (
              <div className="space-y-6">
                {/* 1. Core Mental Model & Foundational Invariants Banner */}
                <div className="p-4 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)]/50 space-y-2.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] font-semibold">
                    <BrainCircuit className="w-3.5 h-3.5" />
                    <span>Core Mental Model & First Principles</span>
                  </div>

                  {theory.mentalModel && (
                    <div className="text-xs font-serif italic text-[var(--ink)] leading-relaxed pl-3 border-l-2 border-[var(--accent)]">
                      &ldquo;{theory.mentalModel}&rdquo;
                    </div>
                  )}

                  <p className="text-xs text-[var(--ink)] leading-relaxed">
                    {theory.firstPrinciples}
                  </p>
                </div>

                {/* 2. Executive Discourse Overview */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)] font-semibold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Theoretical Foundations & Discourse</span>
                  </div>
                  <p className="text-xs text-[var(--ink)] leading-relaxed whitespace-pre-line font-sans">
                    {theory.overview}
                  </p>
                </div>

                {/* 3. Deep Technical Discourse Sections */}
                {theory.sections.map((sec, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)]/40 space-y-3.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-[var(--surface-2)] border border-[var(--line)] font-mono text-[10px] font-semibold text-[var(--ink)] flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <h3 className="font-serif text-sm font-medium text-[var(--ink)]">
                        {sec.heading}
                      </h3>
                    </div>

                    <p className="text-xs text-[var(--ink)] leading-relaxed whitespace-pre-line">
                      {sec.body}
                    </p>

                    {/* Code Snippet Box (if present) */}
                    {sec.codeExample && (
                      <div className="rounded-lg border border-[var(--line)] overflow-hidden bg-[#16181D] text-gray-100 shadow-sm mt-3">
                        <div className="px-3 py-1.5 bg-[#1F2228] border-b border-[#2A2F37] flex items-center justify-between text-[11px] font-mono text-gray-300">
                          <div className="flex items-center gap-2">
                            <Code2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                            <span className="font-semibold text-white">{sec.codeExample.title}</span>
                            <span className="text-[10px] text-gray-400">({sec.codeExample.language})</span>
                          </div>
                          <button
                            onClick={() => handleCopyCode(sec.codeExample!.code, idx)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] hover:bg-gray-700 transition-colors cursor-pointer text-gray-300"
                            title="Copy code to clipboard"
                          >
                            {copiedCodeIdx === idx ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-semibold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        <pre className="p-3 text-[11px] font-mono overflow-x-auto leading-relaxed text-emerald-300/90 selection:bg-emerald-900 selection:text-white">
                          <code>{sec.codeExample.code}</code>
                        </pre>

                        {sec.codeExample.explanation && (
                          <div className="p-2.5 bg-[#1B1D22] border-t border-[#2A2F37] text-[11px] text-gray-300 leading-snug">
                            <strong className="text-gray-100">Mechanism: </strong>
                            {sec.codeExample.explanation}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Section Key Takeaways */}
                    {sec.keyTakeaways && sec.keyTakeaways.length > 0 && (
                      <div className="pt-2 border-t border-[var(--line)]/60 space-y-1.5">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
                          Core Invariants
                        </div>
                        <ul className="space-y-1 text-xs text-[var(--ink)]">
                          {sec.keyTakeaways.map((takeaway, tIdx) => (
                            <li key={tIdx} className="flex items-start gap-2">
                              <span className="text-[var(--accent)] font-bold mt-0.5">•</span>
                              <span className="leading-relaxed">{takeaway}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}

                {/* 4. Production Pitfalls & Staff-Level Architectural Antidotes */}
                {theory.pitfalls && theory.pitfalls.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--danger)] font-semibold flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Production Pitfalls & Architectural Antidotes</span>
                    </div>

                    <div className="space-y-3">
                      {theory.pitfalls.map((p, pIdx) => (
                        <div
                          key={pIdx}
                          className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] space-y-2 shadow-2xs"
                        >
                          <div className="flex items-start gap-2 text-xs text-[var(--danger)] font-medium">
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[var(--danger-soft)] text-[var(--danger)] flex-shrink-0">
                              Antipattern
                            </span>
                            <span>{p.antipattern}</span>
                          </div>

                          <div className="text-[11px] text-[var(--ink-muted)] pl-2 border-l-2 border-[var(--line)]">
                            <strong className="text-[var(--ink)]">Runtime Consequence: </strong>
                            {p.consequence}
                          </div>

                          <div className="text-xs text-[var(--ink)] bg-[var(--accent-soft)]/50 p-2.5 rounded-lg border border-[var(--accent)]/20">
                            <strong className="text-[var(--accent)] font-mono text-[11px]">
                              Architectural Remedy:{" "}
                            </strong>
                            <span>{p.solution}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Systems Design & Scale Implications */}
                {theory.systemDesignImplications && (
                  <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)]/60 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[var(--ink-muted)] font-semibold">
                      <Scale className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>System Design & Scalability Implications</span>
                    </div>
                    <p className="text-xs text-[var(--ink)] leading-relaxed">
                      {theory.systemDesignImplications}
                    </p>
                  </div>
                )}

                {/* 6. Mastery Reflection Challenge */}
                {theory.reflectionPrompt && (
                  <div className="p-4 rounded-xl border border-[var(--warn)]/40 bg-[var(--warn-soft)]/40 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[var(--warn)] font-semibold">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Architectural Mastery Challenge</span>
                    </div>
                    <p className="text-xs text-[var(--ink)] leading-relaxed italic">
                      &ldquo;{theory.reflectionPrompt}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LECTURE & VIDEO NOTES */}
        {/* ========================================================================= */}
        {activeTab === "lecture" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-base font-serif font-medium text-[var(--ink)] mb-1.5 leading-snug">
                {session.title}
              </h2>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                {session.objective}
              </p>

              {/* Concepts Tags */}
              {session.concepts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {session.concepts.map((concept, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink-muted)]"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Why this lecture was selected */}
            {activeVideo && activeVideo.why && (
              <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)]">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-muted)] mb-1">
                  Pedagogical Rationale
                </div>
                <p className="text-xs font-serif italic text-[var(--ink)] leading-relaxed">
                  &ldquo;{activeVideo.why}&rdquo;
                </p>
              </div>
            )}

            {/* Quick Switch to Theory */}
            <div className="p-3.5 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)]/30 flex items-center justify-between gap-3">
              <div className="min-w-0 text-xs">
                <span className="font-medium text-[var(--ink)] block">Want in-depth theory?</span>
                <span className="text-[11px] text-[var(--ink-muted)]">
                  Explore full discourse, code examples, and pitfall antidotes.
                </span>
              </div>
              <button
                onClick={() => setActiveTab("discourse")}
                className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-medium hover:opacity-90 transition-opacity flex-shrink-0 cursor-pointer"
              >
                Read Discourse →
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CHECKPOINTS & QUIZ */}
        {/* ========================================================================= */}
        {activeTab === "quiz" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {checkpoints.length > 0 && currentCheckpoint ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono uppercase tracking-wider text-[var(--ink-muted)] text-[11px]">
                    Checkpoint {currentCheckpointIdx + 1} of {checkpoints.length}
                  </span>
                  <span className="text-[11px] text-[var(--accent)] font-medium">
                    {currentCheckpoint.type === "practical_task" ? "Practical Task" : "Verification"}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-3">
                  <p className="text-xs font-medium text-[var(--ink)] leading-relaxed">
                    {currentCheckpoint.question}
                  </p>

                  {/* Options */}
                  <div className="space-y-1.5 pt-1">
                    {currentCheckpoint.options.map((opt, optIdx) => {
                      const qId = currentCheckpoint.id;
                      const isSubmitted = submittedCheckpoints[qId];
                      const isSelected = selectedOptions[qId] === optIdx;
                      const isCorrectAnswer = optIdx === currentCheckpoint.correctIndex;

                      let optionStyle =
                        "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-2)]";

                      if (isSubmitted) {
                        if (isCorrectAnswer) {
                          optionStyle = "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium";
                        } else if (isSelected && !isCorrectAnswer) {
                          optionStyle = "border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)]";
                        } else {
                          optionStyle = "border-[var(--line)] opacity-50 bg-[var(--surface)]";
                        }
                      } else if (isSelected) {
                        optionStyle = "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)] font-medium ring-1 ring-[var(--accent)]";
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={isSubmitted}
                          onClick={() => handleSelectOption(qId, optIdx)}
                          className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors flex items-start gap-2 cursor-pointer ${optionStyle}`}
                        >
                          <span className="font-mono text-[var(--ink-muted)] flex-shrink-0">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Submit or Explanation */}
                  {!submittedCheckpoints[currentCheckpoint.id] ? (
                    <div className="pt-2 flex justify-end">
                      <button
                        disabled={selectedOptions[currentCheckpoint.id] === undefined}
                        onClick={() => handleSubmitQuestion(currentCheckpoint)}
                        className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer"
                      >
                        Verify Answer
                      </button>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-[var(--line)] space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        {selectedOptions[currentCheckpoint.id] === currentCheckpoint.correctIndex ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 stroke-2" /> Correct understanding
                          </span>
                        ) : (
                          <span className="text-[var(--danger)] flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Incorrect
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
                        {currentCheckpoint.explanation}
                      </p>

                      {/* Next Checkpoint button */}
                      {currentCheckpointIdx < checkpoints.length - 1 && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => setCurrentCheckpointIdx(currentCheckpointIdx + 1)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--accent)] transition-colors cursor-pointer"
                          >
                            <span>Next Question</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-xs text-[var(--ink-muted)] text-center space-y-2">
                <p>Interactive verification checkpoints are configured for this session.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Fixed Bottom Completion Bar */}
      <div className="p-4 border-t border-[var(--line)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-shrink-0">
        <button
          onClick={onToggleComplete}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
            isCompleted
              ? "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30 font-semibold"
              : "bg-[var(--accent)] text-white hover:opacity-90 shadow-2xs"
          }`}
        >
          {isCompleted ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-[var(--accent)] fill-current" />
              <span>Completed</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 stroke-2" />
              <span>Mark Session Complete</span>
            </>
          )}
        </button>

        {/* Difficulty Calibration Feedback */}
        <div className="flex items-center gap-1 border border-[var(--line)] rounded-lg p-0.5 bg-[var(--surface-2)]">
          <button
            onClick={() => onFeedback("too_easy")}
            className="px-2 py-1 text-[10px] font-mono rounded hover:bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            title="Calibrate: Too Easy (Accelerate pace)"
          >
            Easy
          </button>
          <span className="text-[var(--line)]">|</span>
          <button
            onClick={() => onFeedback("too_hard")}
            className="px-2 py-1 text-[10px] font-mono rounded hover:bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            title="Calibrate: Too Hard (Break into smaller steps)"
          >
            Hard
          </button>
        </div>
      </div>
    </div>
  );
}
