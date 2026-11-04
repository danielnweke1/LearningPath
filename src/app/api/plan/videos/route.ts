import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SessionSchema, SkillLevelSchema } from "@/types/plan";
import { searchAndRankVideos, createSearchFallback } from "@/lib/youtube";
import { selectVideosWithLLM } from "@/lib/openai";

const RequestSchema = z.object({
  sessions: z.array(SessionSchema),
  userLevel: SkillLevelSchema.default("Intermediate"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { sessions, userLevel } = parsed.data;
    const enrichedSessions = [];

    for (const session of sessions) {
      const query = session.search_queries[0] || `${session.title} guide`;
      const { candidates, isQuotaFallback } = await searchAndRankVideos(
        query,
        session.concepts,
        session.target_video_minutes_range
      );

      if (candidates.length >= 2 && !isQuotaFallback) {
        const selection = await selectVideosWithLLM(session, userLevel, candidates);
        enrichedSessions.push({
          ...session,
          video: selection.primary,
          alternate_video: selection.alternate,
        });
      } else {
        enrichedSessions.push({
          ...session,
          video: createSearchFallback(query, session.title, session.target_video_minutes_range),
          alternate_video: createSearchFallback(
            session.search_queries[1] || query,
            `${session.title} (Alternate)`,
            session.target_video_minutes_range
          ),
        });
      }
    }

    return NextResponse.json({ sessions: enrichedSessions });
  } catch (err: any) {
    console.error("Video enrichment error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch videos" }, { status: 500 });
  }
}
