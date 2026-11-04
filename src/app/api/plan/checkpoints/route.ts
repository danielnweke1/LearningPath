import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateSessionCheckpoints } from "@/lib/openai";

const RequestSchema = z.object({
  sessionTitle: z.string(),
  objective: z.string(),
  concepts: z.array(z.string()).default([]),
  level: z.string().default("Intermediate"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { sessionTitle, objective, concepts, level } = parsed.data;
    const checkpoints = await generateSessionCheckpoints(sessionTitle, objective, concepts, level);

    return NextResponse.json({ checkpoints });
  } catch (e: any) {
    console.error("Checkpoints generation error:", e);
    return NextResponse.json({ error: e.message || "Failed to generate checkpoints" }, { status: 500 });
  }
}
