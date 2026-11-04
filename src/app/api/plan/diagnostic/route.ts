import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateDiagnosticQuestions } from "@/lib/openai";
import { SkillLevel } from "@/types/plan";

const RequestSchema = z.object({
  topic: z.string().min(2),
});

const EvaluateSchema = z.object({
  topic: z.string(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      levelTarget: z.string(),
      isCorrect: z.boolean(),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if evaluating results
    if (body.answers) {
      const parsed = EvaluateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid evaluation payload" }, { status: 400 });
      }

      const { answers } = parsed.data;
      const totalCorrect = answers.filter((a) => a.isCorrect).length;

      let verdict: SkillLevel = "Beginner";
      let reason = "You're starting fresh with foundational concepts. A structured, bottom-up path will serve you best.";

      if (totalCorrect === 5) {
        verdict = "Advanced";
        reason = "Demonstrated mastery of underlying system design, failure modes, and performance trade-offs.";
      } else if (totalCorrect >= 3) {
        verdict = "Intermediate";
        reason = "Solid grasp of core architectural patterns with room to master production edge cases.";
      } else if (totalCorrect >= 1) {
        verdict = "Some experience";
        reason = "Familiar with baseline syntax and principles, ready to build working systems.";
      }

      return NextResponse.json({
        verdict,
        reason,
        score: totalCorrect,
      });
    }

    // Otherwise generate the 5 questions
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const questions = await generateDiagnosticQuestions(parsed.data.topic);
    return NextResponse.json({ questions });
  } catch (e: any) {
    console.error("Diagnostic API error:", e);
    return NextResponse.json({ error: e.message || "Failed to process diagnostic" }, { status: 500 });
  }
}
