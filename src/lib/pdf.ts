import { Plan } from "@/types/plan";
import { jsPDF } from "jspdf";

/**
 * Generates and downloads a clean, print-typeset PDF of the study plan
 */
export function exportPlanPDF(plan: Plan): void {
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = 50;

  // Header Title
  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.setTextColor(22, 24, 29); // #16181D
  doc.text(plan.title, margin, y);
  y += 24;

  // Metadata sub-line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(107, 111, 118); // #6B6F76
  const metaText = `Level: ${plan.intake.currentLevel}  |  Pace: ${plan.intake.hoursPerWeek} hrs/week  |  Duration: ${plan.intake.targetWeeks} weeks  |  Growth: ${plan.intake.growthIntent}`;
  doc.text(metaText, margin, y);
  y += 18;

  // Separator rule
  doc.setDrawColor(228, 225, 217); // #E4E1D9
  doc.setLineWidth(0.75);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  // Plan Summary
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  const summaryLines = doc.splitTextToSize(plan.summary, contentWidth);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 14 + 16;

  // Iterate Phases & Weeks
  for (const phase of plan.phases) {
    if (y > 720) {
      doc.addPage();
      y = 50;
    }

    // Phase Title
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.setTextColor(47, 93, 80); // #2F5D50
    doc.text(phase.title, margin, y);
    y += 16;

    // Phase Goal
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(107, 111, 118);
    const goalLines = doc.splitTextToSize(`Goal: ${phase.goal}`, contentWidth);
    doc.text(goalLines, margin, y);
    y += goalLines.length * 12 + 10;

    for (const week of phase.weeks) {
      if (y > 730) {
        doc.addPage();
        y = 50;
      }

      // Week Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(22, 24, 29);
      doc.text(week.theme, margin + 8, y);
      y += 14;

      for (const session of week.sessions) {
        if (y > 750) {
          doc.addPage();
          y = 50;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(22, 24, 29);
        doc.text(`• ${session.title} (${session.estimated_minutes} min)`, margin + 16, y);
        y += 12;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(107, 111, 118);
        const objLines = doc.splitTextToSize(session.objective, contentWidth - 30);
        doc.text(objLines, margin + 24, y);
        y += objLines.length * 11 + 4;

        if (session.video) {
          doc.setTextColor(47, 93, 80);
          doc.text(`Video: ${session.video.title} [${session.video.channel} - ${session.video.duration}]`, margin + 24, y);
          y += 12;
        }
        y += 4;
      }
      y += 8;
    }

    // Phase Project Milestone
    if (phase.project) {
      if (y > 730) {
        doc.addPage();
        y = 50;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(183, 121, 31); // #B7791F
      doc.text(`Milestone Project: ${phase.project.title}`, margin + 8, y);
      y += 12;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);
      const briefLines = doc.splitTextToSize(phase.project.brief, contentWidth - 20);
      doc.text(briefLines, margin + 16, y);
      y += briefLines.length * 11 + 16;
    }
  }

  // Save
  doc.save(`${plan.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`);
}
