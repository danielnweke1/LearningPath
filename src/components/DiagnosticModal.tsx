"use client";

import { useState } from "react";
import { X, CheckCircle2, ChevronRight, HelpCircle, Loader2 } from "lucide-react";
import { DiagnosticQuestion, SkillLevel } from "@/types/plan";

interface DiagnosticModalProps {
  topic: string;
  isOpen: boolean;
  onClose: () => void;
  onApplyVerdict: (verdict: SkillLevel, reason: string, score: number) => void;
}

export function DiagnosticModal({
  topic,
  isOpen,
  onClose,
  onApplyVerdict,
}: DiagnosticModalProps) {
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<
    { questionId: string; levelTarget: string; isCorrect: boolean }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [verdict, setVerdict] = useState<{
    verdict: SkillLevel;
    reason: string;
    score: number;
  } | null>(null);

  // Initialize questions
  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/plan/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic || "Software Engineering" }),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setCurrentIndex(0);
        setAnswers([]);
        setVerdict(null);
      }
    } catch (e) {
      console.warn("Failed to load diagnostic notice:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (selectedOption === null) return;
    const currentQ = questions[currentIndex];
    const isCorrect = selectedOption === currentQ.correctIndex;
    const nextAnswers = [
      ...answers,
      {
        questionId: currentQ.id,
        levelTarget: currentQ.levelTarget,
        isCorrect,
      },
    ];
    setAnswers(nextAnswers);
    setSelectedOption(null);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Evaluate verdict
      setIsLoading(true);
      try {
        const res = await fetch("/api/plan/diagnostic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, answers: nextAnswers }),
        });
        const evalData = await res.json();
        setVerdict(evalData);
      } catch (e) {
        console.warn("Evaluation notice:", e);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[var(--surface)] border border-[var(--line)] rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[var(--accent)] stroke-[1.5]" />
            <h3 className="font-medium text-base font-serif">Level Diagnostic</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {isLoading && questions.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)] mb-3" />
              <p className="text-sm text-[var(--ink-muted)]">
                Calibrating 5 diagnostic questions for &ldquo;{topic}&rdquo;...
              </p>
            </div>
          ) : questions.length === 0 ? (
            <div className="py-8 text-center space-y-4">
              <p className="text-sm text-[var(--ink-muted)]">
                Answer 5 progressive questions to determine whether your plan should calibrate for Beginner, Some experience, Intermediate, or Advanced depth.
              </p>
              <button
                onClick={loadQuestions}
                className="px-4 py-2 text-xs font-medium rounded-md bg-[var(--accent)] text-white hover:opacity-90"
              >
                Begin 5-Question Diagnostic
              </button>
            </div>
          ) : verdict ? (
            <div className="py-4 space-y-4 text-center">
              <div className="inline-flex p-3 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] mb-1">
                <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h4 className="font-serif text-xl text-[var(--ink)]">
                Level Verdict: {verdict.verdict}
              </h4>
              <p className="text-sm text-[var(--ink-muted)] max-w-md mx-auto leading-relaxed">
                {verdict.reason}
              </p>
              <div className="text-xs font-mono text-[var(--ink-muted)] pt-2">
                Diagnostic score: {verdict.score} of 5 questions answered correctly.
              </div>
              <div className="pt-4 flex gap-3 justify-center">
                <button
                  onClick={() => {
                    onApplyVerdict(verdict.verdict, verdict.reason, verdict.score);
                    onClose();
                  }}
                  className="px-5 py-2 text-xs font-medium rounded-md bg-[var(--accent)] text-white hover:opacity-90"
                >
                  Apply Verdict to Plan
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium rounded-md bg-[var(--surface-2)] border border-[var(--line)]"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[var(--ink-muted)] pb-1 border-b border-[var(--line)]">
                <span>
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--accent)]">
                  Target: {questions[currentIndex].levelTarget}
                </span>
              </div>

              <p className="text-sm font-medium text-[var(--ink)] leading-snug">
                {questions[currentIndex].question}
              </p>

              <div className="space-y-2 pt-2">
                {questions[currentIndex].options.map((opt, oIdx) => {
                  const isSelected = selectedOption === oIdx;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => setSelectedOption(oIdx)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs transition-colors flex items-start gap-2.5 ${
                        isSelected
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)] font-medium"
                          : "border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--ink)]"
                      }`}
                    >
                      <span className="font-mono text-[var(--ink-muted)]">
                        {String.fromCharCode(65 + oIdx)}.
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-[var(--line)]">
                <button
                  onClick={onClose}
                  className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]"
                >
                  Skip diagnostic
                </button>
                <button
                  onClick={handleNext}
                  disabled={selectedOption === null || isLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : currentIndex + 1 === questions.length ? (
                    "Finish & Evaluate"
                  ) : (
                    <>
                      Next Question
                      <ChevronRight className="w-3.5 h-3.5 stroke-[1.5]" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
