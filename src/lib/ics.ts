import { Plan } from "@/types/plan";

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Generates an RFC 5545 compliant .ics calendar string scheduling all sessions
 */
export function generateICSString(plan: Plan, startFromDate: Date = new Date()): string {
  const events: string[] = [];

  // Start on next Monday at 18:00 (6:00 PM) if starting fresh
  const cursorDate = new Date(startFromDate);
  const dayOfWeek = cursorDate.getDay();
  const daysUntilMonday = dayOfWeek === 1 ? 0 : (8 - dayOfWeek) % 7;
  cursorDate.setDate(cursorDate.getDate() + daysUntilMonday);
  cursorDate.setHours(18, 0, 0, 0);

  let sessionCount = 0;

  for (const phase of plan.phases) {
    for (const week of phase.weeks) {
      // Days to distribute sessions across: Mon (0), Wed (2), Fri (4), Sat (5)
      const daysOffset = [0, 2, 4, 5, 6, 1, 3];

      week.sessions.forEach((session, sessionIdx) => {
        sessionCount++;
        const eventStart = new Date(cursorDate);
        const dayShift = (week.number - 1) * 7 + (daysOffset[sessionIdx % daysOffset.length] || 0);
        eventStart.setDate(cursorDate.getDate() + dayShift);

        const durationMinutes = session.estimated_minutes || 45;
        const eventEnd = new Date(eventStart.getTime() + durationMinutes * 60 * 1000);

        const uid = `session-${session.id}-${plan.id}@learningpath.app`;
        const summary = `[LearningPath] ${session.title}`;
        const descriptionLines = [
          `Session Objective: ${session.objective}`,
          `Estimated Duration: ${durationMinutes} minutes`,
          `Difficulty: ${session.difficulty}`,
          session.video?.url ? `Recommended Video: ${session.video.url}` : "",
          `Concepts: ${session.concepts.join(", ")}`,
        ].filter(Boolean);

        const description = descriptionLines.join("\\n");

        events.push(
          [
            "BEGIN:VEVENT",
            `UID:${uid}`,
            `DTSTAMP:${formatICSDate(new Date())}`,
            `DTSTART:${formatICSDate(eventStart)}`,
            `DTEND:${formatICSDate(eventEnd)}`,
            `SUMMARY:${summary}`,
            `DESCRIPTION:${description}`,
            "STATUS:CONFIRMED",
            "END:VEVENT",
          ].join("\r\n")
        );
      });
    }
  }

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LearningPath//Adaptive Study Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${plan.title}`,
    "X-WR-TIMEZONE:UTC",
    events.join("\r\n"),
    "END:VCALENDAR",
  ].join("\r\n");

  return icsContent;
}

/**
 * Triggers a browser download of the .ics calendar file
 */
export function downloadICS(plan: Plan): void {
  const content = generateICSString(plan);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${plan.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
