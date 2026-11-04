"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, X, Command, CornerDownLeft, CheckSquare } from "lucide-react";
import { Plan, Session } from "@/types/plan";

interface CommandPaletteProps {
  plan: Plan | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (session: Session) => void;
  completedSessionIds: string[];
}

export function CommandPalette({
  plan,
  isOpen,
  onClose,
  onSelectSession,
  completedSessionIds,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Flatten all sessions
  const allSessions = useMemo(() => {
    if (!plan) return [];
    const list: { session: Session; weekNumber: number; phaseTitle: string }[] = [];
    for (const phase of plan.phases) {
      for (const week of phase.weeks) {
        for (const session of week.sessions) {
          list.push({ session, weekNumber: week.number, phaseTitle: phase.title });
        }
      }
    }
    return list;
  }, [plan]);

  // Filter based on query
  const filtered = useMemo(() => {
    if (!query.trim()) return allSessions.slice(0, 8);
    const q = query.toLowerCase();
    return allSessions
      .filter(
        (item) =>
          item.session.title.toLowerCase().includes(q) ||
          item.session.objective.toLowerCase().includes(q) ||
          item.session.concepts.some((c) => c.toLowerCase().includes(q)) ||
          item.phaseTitle.toLowerCase().includes(q) ||
          `week ${item.weekNumber}`.includes(q)
      )
      .slice(0, 10);
  }, [allSessions, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation within command palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < filtered.length ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        onSelectSession(filtered[selectedIndex].session);
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose, onSelectSession]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-[2px] transition-opacity duration-150 animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        className="w-full max-w-xl bg-[var(--surface)] border border-[var(--line)] rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-[var(--line)]">
          <Search className="w-4 h-4 text-[var(--ink-muted)] mr-3 stroke-[1.5]" />
          <input
            type="text"
            className="w-full bg-transparent text-[var(--ink)] placeholder-[var(--ink-muted)] text-sm focus:outline-none"
            placeholder="Search sessions, concepts, or weeks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-[var(--ink-muted)] bg-[var(--surface-2)] rounded border border-[var(--line)]">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--ink-muted)]">
              No matching sessions found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isCompleted = completedSessionIds.includes(item.session.id);
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.session.id}
                  onClick={() => {
                    onSelectSession(item.session);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                    isSelected
                      ? "bg-[var(--accent-soft)] text-[var(--ink)]"
                      : "hover:bg-[var(--surface-2)] text-[var(--ink)]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isCompleted ? "bg-[var(--accent)]" : "border border-[var(--ink-muted)]"
                      }`}
                    />
                    <div className="truncate">
                      <div className="font-medium text-[13px] truncate">
                        {item.session.title}
                      </div>
                      <div className="text-[11px] text-[var(--ink-muted)] truncate">
                        Week {item.weekNumber} · {item.session.estimated_minutes}m · {item.session.difficulty}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 text-xs text-[var(--ink-muted)] font-mono">
                    {isSelected && <CornerDownLeft className="w-3.5 h-3.5 stroke-[1.5]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 border-t border-[var(--line)] bg-[var(--surface-2)] flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
          <span>Use ↑ ↓ to navigate</span>
          <span>Enter to select</span>
        </div>
      </div>
    </div>
  );
}

export function ShortcutsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
          <h3 className="font-medium text-base font-serif">Keyboard Shortcuts</h3>
          <button
            onClick={onClose}
            className="p-1 text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        <div className="py-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[var(--ink)]">Search & Jump</span>
            <kbd className="px-2 py-0.5 text-xs font-mono bg-[var(--surface-2)] border border-[var(--line)] rounded">
              Cmd + K / Ctrl + K
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--ink)]">Next / Previous Session</span>
            <div className="flex gap-1">
              <kbd className="px-2 py-0.5 text-xs font-mono bg-[var(--surface-2)] border border-[var(--line)] rounded">
                j
              </kbd>
              <kbd className="px-2 py-0.5 text-xs font-mono bg-[var(--surface-2)] border border-[var(--line)] rounded">
                k
              </kbd>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--ink)]">Open Selected Session</span>
            <kbd className="px-2 py-0.5 text-xs font-mono bg-[var(--surface-2)] border border-[var(--line)] rounded">
              Enter
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--ink)]">Toggle Session Complete</span>
            <kbd className="px-2 py-0.5 text-xs font-mono bg-[var(--surface-2)] border border-[var(--line)] rounded">
              x
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--ink)]">Show Shortcuts</span>
            <kbd className="px-2 py-0.5 text-xs font-mono bg-[var(--surface-2)] border border-[var(--line)] rounded">
              ?
            </kbd>
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--line)] flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--surface-2)] border border-[var(--line)] hover:bg-[var(--line)]"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
