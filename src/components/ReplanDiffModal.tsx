"use client";

import { X, GitCommit, Plus, Minus, Edit3, Check } from "lucide-react";
import { ReplanPatch } from "@/types/plan";

interface ReplanDiffModalProps {
  patch: ReplanPatch | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  isDemo?: boolean;
}

export function ReplanDiffModal({
  patch,
  isOpen,
  onClose,
  onAccept,
  isDemo = false,
}: ReplanDiffModalProps) {
  if (!isOpen || !patch) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[var(--surface)] border border-[var(--line)] rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner if Demo */}
        {isDemo && (
          <div className="px-5 py-2.5 bg-[var(--accent-soft)] border-b border-[var(--line)] text-xs text-[var(--accent)] font-medium">
            Demo preview: live replanning runs in the real app. Showing pre-computed adaptive adjustment.
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-[var(--accent)] stroke-[1.5]" />
            <h3 className="font-serif text-base font-medium text-[var(--ink)]">
              Curriculum Pace Adjustment Diff
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Why & Explanation */}
          <div className="p-3.5 rounded-lg border border-[var(--line)] bg-[var(--surface-2)]">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)] mb-1">
              Rationale
            </div>
            <p className="text-xs text-[var(--ink)] leading-relaxed">
              {patch.explanation}
            </p>
          </div>

          {/* Modifications Diff List */}
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-[var(--ink-muted)]">
              Proposed Schedule Changes
            </div>

            <div className="space-y-2">
              {patch.modifications.map((mod, idx) => {
                const isAdd = mod.type === "add";
                const isRemove = mod.type === "remove";

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs flex items-start gap-3 ${
                      isAdd
                        ? "border-emerald-300 dark:border-emerald-800 bg-[var(--accent-soft)] text-[var(--ink)]"
                        : isRemove
                        ? "border-red-200 dark:border-red-900 bg-[var(--danger-soft)] text-[var(--ink-muted)] line-through"
                        : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]"
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {isAdd ? (
                        <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : isRemove ? (
                        <Minus className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                      ) : (
                        <Edit3 className="w-3.5 h-3.5 text-[var(--accent)]" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-mono text-[10px] text-[var(--ink-muted)]">
                        Week {mod.weekNumber} · {mod.type.toUpperCase()}
                      </div>
                      <div className="leading-snug">{mod.changes}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] text-[var(--ink-muted)]">
            All previously completed sessions and checkpoint scores are permanently preserved.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-[var(--line)] bg-[var(--surface-2)] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-2)]"
          >
            Reject / Keep Current Plan
          </button>
          <button
            onClick={() => {
              onAccept();
              onClose();
            }}
            className="px-4 py-2 text-xs font-medium rounded-md bg-[var(--accent)] text-white hover:opacity-90 inline-flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 stroke-[2]" />
            Accept Replan
          </button>
        </div>
      </div>
    </div>
  );
}
