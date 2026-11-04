"use client";

import { useState } from "react";
import { X, FileText, Calendar, Download, Upload, Check } from "lucide-react";
import { Plan } from "@/types/plan";
import { downloadICS } from "@/lib/ics";
import { exportPlanPDF } from "@/lib/pdf";
import { planStorage } from "@/lib/storage";

interface ExportModalProps {
  plan: Plan;
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (imported: Plan) => void;
}

export function ExportModal({
  plan,
  isOpen,
  onClose,
  onImportSuccess,
}: ExportModalProps) {
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    exportPlanPDF(plan);
  };

  const handleDownloadICS = () => {
    downloadICS(plan);
  };

  const handleExportJSON = async () => {
    const jsonStr = await planStorage.exportPlanAsJSON(plan.id);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${plan.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_backup.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const imported = await planStorage.importPlanFromJSON(text);
        if (onImportSuccess) {
          onImportSuccess(imported);
        }
        onClose();
      } catch (err: any) {
        console.error("Import failed:", err);
        setImportError("Invalid plan file. Please choose a valid LearningPath JSON export.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)]">
          <h3 className="font-serif text-base font-medium text-[var(--ink)]">
            Export & Calendar Sync
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* PDF Download */}
          <button
            onClick={handleDownloadPDF}
            className="w-full flex items-center justify-between p-3.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-[var(--surface-2)] text-[var(--ink)]">
                <FileText className="w-4 h-4 stroke-[1.5]" />
              </div>
              <div>
                <div className="text-xs font-medium text-[var(--ink)]">Download Plan as PDF</div>
                <div className="text-[11px] text-[var(--ink-muted)]">
                  Print-ready syllabus with sessions, objectives, and milestones
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-[var(--ink-muted)] stroke-[1.5]" />
          </button>

          {/* iCalendar Download */}
          <button
            onClick={handleDownloadICS}
            className="w-full flex items-center justify-between p-3.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-[var(--surface-2)] text-[var(--accent)]">
                <Calendar className="w-4 h-4 stroke-[1.5]" />
              </div>
              <div>
                <div className="text-xs font-medium text-[var(--ink)]">
                  Export as .ics Calendar File
                </div>
                <div className="text-[11px] text-[var(--ink-muted)]">
                  Sessions distributed across your weeks for Apple/Google Calendar
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-[var(--ink-muted)] stroke-[1.5]" />
          </button>

          {/* JSON Export */}
          <button
            onClick={handleExportJSON}
            className="w-full flex items-center justify-between p-3.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-[var(--surface-2)] text-[var(--ink)]">
                <Download className="w-4 h-4 stroke-[1.5]" />
              </div>
              <div>
                <div className="text-xs font-medium text-[var(--ink)]">Export Full State (JSON)</div>
                <div className="text-[11px] text-[var(--ink-muted)]">
                  Save plan and completed session progress to a file
                </div>
              </div>
            </div>
          </button>

          {/* JSON Import */}
          <div className="pt-2 border-t border-[var(--line)]">
            <label className="w-full flex items-center justify-between p-3.5 rounded-lg border border-dashed border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-[var(--surface)] text-[var(--ink-muted)]">
                  <Upload className="w-4 h-4 stroke-[1.5]" />
                </div>
                <div>
                  <div className="text-xs font-medium text-[var(--ink)]">Import Plan from JSON</div>
                  <div className="text-[11px] text-[var(--ink-muted)]">
                    Restore previously exported roadmap file
                  </div>
                </div>
              </div>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
            {importError && (
              <div className="text-[11px] text-[var(--danger)] mt-2">{importError}</div>
            )}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-[var(--line)] bg-[var(--surface-2)] flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
