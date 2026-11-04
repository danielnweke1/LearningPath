import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateTheoreticalDiscourse } from "@/lib/openai";
import { checkRateLimit } from "@/lib/rate-limit";

const RequestSchema = z.object({
  sessionTitle: z.string().min(1),
  objective: z.string().default(""),
  concepts: z.array(z.string()).default([]),
  weekTheme: z.string().optional(),
  level: z.string().default("Intermediate"),
  goal: z.string().optional(),
  speciality: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rate = checkRateLimit(`discourse_${ip}`, 300, 60_000);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many discourse generation requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const discourse = await generateTheoreticalDiscourse({
      sessionTitle: data.sessionTitle,
      objective: data.objective,
      concepts: data.concepts,
      weekTheme: data.weekTheme,
      level: data.level,
      goal: data.goal,
      speciality: data.speciality,
    });

    return NextResponse.json({ discourse });
  } catch (err: any) {
    console.error("Discourse API Route Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate theoretical discourse" },
      { status: 500 }
    );
  }
}
