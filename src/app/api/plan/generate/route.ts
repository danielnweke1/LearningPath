import { NextRequest, NextResponse } from "next/server";
import { IntakeInputSchema, Plan, PlanSchema } from "@/types/plan";
import { checkRateLimit } from "@/lib/rate-limit";
import { generatePlanSkeleton, selectVideosWithLLM } from "@/lib/openai";
import { searchAndRankVideos, createSearchFallback } from "@/lib/youtube";
import { synthesizeDynamicPlan, extractSubjectTerm } from "@/lib/curriculum-synthesizer";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rate = checkRateLimit(ip, 15, 60_000);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before generating another plan." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const intakeParsed = IntakeInputSchema.safeParse(body);
    if (!intakeParsed.success) {
      return NextResponse.json(
        { error: "Invalid intake parameters", details: intakeParsed.error.flatten() },
        { status: 400 }
      );
    }

    const intake = intakeParsed.data;

    // Stage A: Generate Plan Skeleton (strictly server-side via process.env)
    let stageAResult = await generatePlanSkeleton(intake);

    if (stageAResult.refusal_reason || !stageAResult.plan) {
      // Intelligently fallback to dynamic curriculum engine to ensure seamless user experience
      const fallback = synthesizeDynamicPlan(intake, intake.goal, intake.speciality || "");
      if (fallback.plan) {
        stageAResult = fallback;
      } else {
        return NextResponse.json(
          { error: stageAResult.refusal_reason || "Unable to generate curriculum for this topic." },
          { status: 400 }
        );
      }
    }

    if (stageAResult.clarifying_question && !stageAResult.plan) {
      return NextResponse.json(
        { clarifying_question: stageAResult.clarifying_question },
        { status: 200 }
      );
    }

    if (!stageAResult.plan) {
      return NextResponse.json(
        { error: "Unable to generate curriculum for this topic. Please try rephrasing your goal." },
        { status: 500 }
      );
    }

    const rawPlan = stageAResult.plan;
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Build plan structure
    const initialPlan: Plan = {
      id: planId,
      title: rawPlan.title,
      summary: rawPlan.summary,
      assumptions: rawPlan.assumptions,
      intake,
      phases: rawPlan.phases,
      created_at: new Date().toISOString(),
    };

    const targetSubject = extractSubjectTerm(intake.goal, intake.speciality);

    // Ensure all phase titles, week themes, and session titles reflect the exact domain subject
    if (targetSubject) {
      for (let pIdx = 0; pIdx < initialPlan.phases.length; pIdx++) {
        const p = initialPlan.phases[pIdx];
        if (!p.title.toLowerCase().includes(targetSubject.toLowerCase())) {
          p.title = p.title.replace(/^Phase \d+:\s*/, (m) => `${m}${targetSubject} `);
        }
        for (const w of p.weeks) {
          if (!w.theme.toLowerCase().includes(targetSubject.toLowerCase())) {
            w.theme = w.theme.replace(/^Week \d+:\s*/, (m) => `${m}${targetSubject} — `);
          }
          for (const s of w.sessions) {
            if (!s.title.toLowerCase().includes(targetSubject.toLowerCase())) {
              s.title = `${targetSubject}: ${s.title}`;
            }
          }
        }
      }
    }

    // Stage B & C: Video matching for ALL weeks across ALL phases with global deduplication
    const usedVideoIds = new Set<string>();

    for (const phase of initialPlan.phases) {
      for (const week of phase.weeks) {
        for (const session of week.sessions) {
          // Strictly anchor the search query to the target subject domain
          let rawQuery = session.search_queries[0] || `${session.title} tutorial`;
          let query = rawQuery;
          if (targetSubject && !query.toLowerCase().includes(targetSubject.toLowerCase())) {
            query = `${targetSubject} ${query}`;
          }

          let rawAltQuery = session.search_queries[1] || `${session.title} deep dive`;
          let altQuery = rawAltQuery;
          if (targetSubject && !altQuery.toLowerCase().includes(targetSubject.toLowerCase())) {
            altQuery = `${targetSubject} ${altQuery}`;
          }

          const conceptsWithSubject =
            targetSubject && !session.concepts.some((c) => c.toLowerCase().includes(targetSubject.toLowerCase()))
              ? [targetSubject, ...session.concepts]
              : session.concepts;

          const { candidates, isQuotaFallback } = await searchAndRankVideos(
            query,
            conceptsWithSubject,
            session.target_video_minutes_range
          );

          // Deduplicate: filter out any candidates already assigned to another session in this plan
          const unusedCandidates = candidates.filter((c) => !usedVideoIds.has(c.id));

          if (unusedCandidates.length >= 2 && !isQuotaFallback) {
            const selection = await selectVideosWithLLM(
              session,
              intake.currentLevel,
              unusedCandidates
            );
            session.video = selection.primary;
            session.alternate_video = selection.alternate;

            usedVideoIds.add(selection.primary.videoId);
            usedVideoIds.add(selection.alternate.videoId);
          } else if (unusedCandidates.length === 1 && !isQuotaFallback) {
            const primaryCand = unusedCandidates[0];
            session.video = {
              videoId: primaryCand.id,
              title: primaryCand.title,
              channel: primaryCand.channelTitle,
              duration: primaryCand.durationFormatted,
              durationSeconds: primaryCand.durationSeconds,
              thumbnail: primaryCand.thumbnail,
              url: `https://www.youtube.com/watch?v=${primaryCand.id}`,
              why: `Vetted technical tutorial from ${primaryCand.channelTitle} directly targeting ${session.title}.`,
              views: primaryCand.viewCount,
            };
            usedVideoIds.add(primaryCand.id);

            session.alternate_video = createSearchFallback(
              altQuery,
              `${session.title} (Deep Dive)`,
              session.target_video_minutes_range
            );
          } else {
            // Graceful fallback to verified YouTube query links with distinct queries
            session.video = createSearchFallback(
              query,
              session.title,
              session.target_video_minutes_range
            );
            session.alternate_video = createSearchFallback(
              altQuery,
              `${session.title} (Deep Dive)`,
              session.target_video_minutes_range
            );
          }
        }
      }
    }

    const validated = PlanSchema.parse(initialPlan);
    return NextResponse.json({ plan: validated });
  } catch (err: any) {
    console.error("Plan generation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate learning plan. Please try again." },
      { status: 500 }
    );
  }
}
