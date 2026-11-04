import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateAdaptiveReplan } from "@/lib/openai";

const RequestSchema = z.object({
  currentPlanTitle: z.string(),
  completedSessionTitles: z.array(z.string()),
  failedCheckpointsCount: z.number().default(0),
  triggerReason: z.string(),
  remainingWeeks: z.number().default(4),
  hoursPerWeek: z.number().default(6),
  phases: z.array(z.any()),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid replan request payload" }, { status: 400 });
    }

    const patch = await generateAdaptiveReplan(parsed.data);
    return NextResponse.json({ patch });
  } catch (err: any) {
    console.error("Replanning error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate plan adjustment" }, { status: 500 });
  }
}
