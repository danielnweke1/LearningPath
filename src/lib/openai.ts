import fs from "fs";
import path from "path";
import OpenAI from "openai";
import {
  IntakeInput,
  StageAResponse,
  StageAResponseSchema,
  VideoRecommendation,
  CheckpointQuestion,
  CheckpointQuestionSchema,
  ReplanPatch,
  ReplanPatchSchema,
  DiagnosticQuestion,
  Session,
  TheoreticalDiscourse,
  TheoreticalDiscourseSchema,
} from "@/types/plan";

import {
  synthesizeDynamicPlan,
  detectDomainCategory,
  DomainCategory,
} from "./curriculum-synthesizer";
import { createSearchFallback } from "./youtube";

// Initialize OpenAI client strictly from server environment variables
function getOpenAIClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key, maxRetries: 0 });
}

/**
 * Load system prompt markdown from /prompts
 */
export function loadPrompt(filename: string): string {
  try {
    const filePath = path.join(process.cwd(), "prompts", filename);
    return fs.readFileSync(filePath, "utf-8");
  } catch (e) {
    console.error(`Failed to load prompt ${filename}:`, e);
    return "";
  }
}

/**
 * Sanitizes untrusted user text inputs (strips control characters, caps length)
 */
export function sanitizeInput(text: string, maxLength = 300): string {
  if (!text) return "";
  return text.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, "").slice(0, maxLength).trim();
}

/**
 * Stage A: Plan Skeleton Generator via GPT-4o with Intelligent Dynamic Synthesis Fallback
 */
export async function generatePlanSkeleton(
  intake: IntakeInput
): Promise<StageAResponse> {
  const client = getOpenAIClient();
  const systemPrompt = loadPrompt("stage_a_plan_v1.md");

  const sanitizedGoal = sanitizeInput(intake.goal, 300);
  const sanitizedSpeciality = sanitizeInput(intake.speciality || "", 300);

  // If no OpenAI API Key is provided or invalid, produce a domain-specific structured curriculum
  if (!client) {
    return synthesizeDynamicPlan(intake, sanitizedGoal, sanitizedSpeciality);
  }

  const userMessage = JSON.stringify({
    goal: sanitizedGoal,
    speciality: sanitizedSpeciality,
    growthIntent: intake.growthIntent,
    currentLevel: intake.currentLevel,
    hoursPerWeek: intake.hoursPerWeek,
    targetWeeks: intake.targetWeeks,
    learningStyle: intake.learningStyle,
    diagnosticResult: intake.diagnosticResult,
  });

  // Retry loop (max 2 retries)
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate the curriculum plan for this request:\n${userMessage}` },
        ],
        response_format: { type: "json_object" },
      });

      const raw = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(raw);
      const validated = StageAResponseSchema.parse(parsed);
      return validated;
    } catch (err: any) {
      console.warn(`Stage A plan generation attempt ${attempt + 1} notice:`, err?.message || err);
      const isQuotaError =
        err?.status === 429 ||
        err?.code === "insufficient_quota" ||
        `${err?.message}`.toLowerCase().includes("credits") ||
        `${err?.message}`.toLowerCase().includes("quota") ||
        `${err?.message}`.toLowerCase().includes("429");

      // Immediate graceful synthesis fallback if quota exhausted or retried
      if (isQuotaError || attempt >= 1) {
        return synthesizeDynamicPlan(intake, sanitizedGoal, sanitizedSpeciality);
      }
    }
  }

  return synthesizeDynamicPlan(intake, sanitizedGoal, sanitizedSpeciality);
}

/**
 * Stage C: Video Selection via GPT-4o
 */
export async function selectVideosWithLLM(
  session: Session,
  userLevel: string,
  candidates: Array<{
    id: string;
    title: string;
    channelTitle: string;
    durationFormatted: string;
    durationSeconds: number;
    thumbnail: string;
    description: string;
    score: number;
    viewCount: number;
  }>
): Promise<{ primary: VideoRecommendation; alternate: VideoRecommendation }> {
  if (candidates.length === 0) {
    throw new Error("No candidates provided");
  }

  const client = getOpenAIClient();
  const systemPrompt = loadPrompt("stage_c_video_selection_v1.md");

  // Fallback if no OpenAI client or candidates < 2
  if (!client || candidates.length === 1) {
    const primaryCandidate = candidates[0];
    const distinctAlt = candidates.find((c) => c.id !== primaryCandidate.id);
    const altCandidate = distinctAlt || candidates[1];

    return {
      primary: {
        videoId: primaryCandidate.id,
        title: primaryCandidate.title,
        channel: primaryCandidate.channelTitle,
        duration: primaryCandidate.durationFormatted,
        durationSeconds: primaryCandidate.durationSeconds,
        thumbnail: primaryCandidate.thumbnail,
        url: `https://www.youtube.com/watch?v=${primaryCandidate.id}`,
        why: `Highest ranked pedagogical match (${Math.round(primaryCandidate.score * 100)}% relevance) covering ${session.concepts.slice(0, 2).join(", ")}.`,
        views: primaryCandidate.viewCount,
      },
      alternate: altCandidate
        ? {
            videoId: altCandidate.id,
            title: altCandidate.title,
            channel: altCandidate.channelTitle,
            duration: altCandidate.durationFormatted,
            durationSeconds: altCandidate.durationSeconds,
            thumbnail: altCandidate.thumbnail,
            url: `https://www.youtube.com/watch?v=${altCandidate.id}`,
            why: `Alternate walkthrough focusing on hands-on practical application.`,
            views: altCandidate.viewCount,
          }
        : createSearchFallback(
            session.search_queries[1] || `${session.title} deep dive walkthrough`,
            `${session.title} (Deep Dive)`,
            session.target_video_minutes_range
          ),
    };
  }

  const topCandidates = candidates.slice(0, 5).map((c) => ({
    id: c.id,
    title: c.title,
    channel: c.channelTitle,
    duration: c.durationFormatted,
    description: c.description.slice(0, 150),
    views: c.viewCount,
  }));

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: JSON.stringify({
            sessionTitle: session.title,
            objective: session.objective,
            level: userLevel,
            concepts: session.concepts,
            candidates: topCandidates,
          }),
        },
      ],
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    const primaryId = parsed.primaryVideoId;
    const alternateId = parsed.alternateVideoId;

    const candMap = new Map(candidates.map((c) => [c.id, c]));
    const primaryCand = candMap.get(primaryId) || candidates[0];
    const distinctAltCand =
      candMap.get(alternateId) ||
      candidates.find((c) => c.id !== primaryCand.id) ||
      candidates[1];

    return {
      primary: {
        videoId: primaryCand.id,
        title: primaryCand.title,
        channel: primaryCand.channelTitle,
        duration: primaryCand.durationFormatted,
        durationSeconds: primaryCand.durationSeconds,
        thumbnail: primaryCand.thumbnail,
        url: `https://www.youtube.com/watch?v=${primaryCand.id}`,
        why: parsed.primaryWhy || `Covers ${session.concepts.join(", ")} with clear architectural explanations at ${userLevel} depth.`,
        views: primaryCand.viewCount,
      },
      alternate: distinctAltCand && distinctAltCand.id !== primaryCand.id
        ? {
            videoId: distinctAltCand.id,
            title: distinctAltCand.title,
            channel: distinctAltCand.channelTitle,
            duration: distinctAltCand.durationFormatted,
            durationSeconds: distinctAltCand.durationSeconds,
            thumbnail: distinctAltCand.thumbnail,
            url: `https://www.youtube.com/watch?v=${distinctAltCand.id}`,
            why: parsed.alternateWhy || `Hands-on alternative walkthrough with complementary implementation details.`,
            views: distinctAltCand.viewCount,
          }
        : createSearchFallback(
            session.search_queries[1] || `${session.title} alternative`,
            `${session.title} (Alternate)`,
            session.target_video_minutes_range
          ),
    };
  } catch (e) {
    console.warn("LLM selection failed, using top deterministic scores:", e);
    const primaryCand = candidates[0];
    const distinctAltCand = candidates.find((c) => c.id !== primaryCand.id);

    return {
      primary: {
        videoId: primaryCand.id,
        title: primaryCand.title,
        channel: primaryCand.channelTitle,
        duration: primaryCand.durationFormatted,
        durationSeconds: primaryCand.durationSeconds,
        thumbnail: primaryCand.thumbnail,
        url: `https://www.youtube.com/watch?v=${primaryCand.id}`,
        why: `Top deterministic candidate matching ${session.concepts.slice(0, 2).join(", ")}.`,
        views: primaryCand.viewCount,
      },
      alternate: distinctAltCand
        ? {
            videoId: distinctAltCand.id,
            title: distinctAltCand.title,
            channel: distinctAltCand.channelTitle,
            duration: distinctAltCand.durationFormatted,
            durationSeconds: distinctAltCand.durationSeconds,
            thumbnail: distinctAltCand.thumbnail,
            url: `https://www.youtube.com/watch?v=${distinctAltCand.id}`,
            why: `Alternative structured presentation with high peer-reviewed signal.`,
            views: distinctAltCand.viewCount,
          }
        : createSearchFallback(
            session.search_queries[1] || `${session.title} deep dive`,
            `${session.title} (Deep Dive)`,
            session.target_video_minutes_range
          ),
    };
  }
}

/**
 * Stage D: Checkpoint Generator via GPT-4o with Domain-Aware Synthesis Fallback
 */
export async function generateSessionCheckpoints(
  sessionTitle: string,
  objective: string,
  concepts: string[],
  level: string
): Promise<CheckpointQuestion[]> {
  const client = getOpenAIClient();
  const systemPrompt = loadPrompt("stage_d_checkpoints_v1.md");

  if (!client) {
    return generateLocalFallbackCheckpoints(sessionTitle, concepts);
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.5,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: JSON.stringify({ sessionTitle, objective, concepts, level }),
        },
      ],
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    const questions = parsed.questions || [];
    return questions.map((q: any, idx: number) =>
      CheckpointQuestionSchema.parse({
        id: `chk_${idx + 1}`,
        type: q.type || "multiple_choice",
        question: q.question,
        options: q.options || [],
        correctIndex: q.correctIndex ?? 0,
        taskCriteria: q.taskCriteria,
        explanation: q.explanation || "Correct principle identified.",
      })
    );
  } catch (err) {
    console.warn("Checkpoint generation failed, using local generator:", err);
    return generateLocalFallbackCheckpoints(sessionTitle, concepts);
  }
}

/**
 * Adaptive Replanning via GPT-4o
 */
export async function generateAdaptiveReplan(params: {
  currentPlanTitle: string;
  completedSessionTitles: string[];
  failedCheckpointsCount: number;
  triggerReason: string;
  remainingWeeks: number;
  hoursPerWeek: number;
  phases: any[];
}): Promise<ReplanPatch> {
  const client = getOpenAIClient();
  const systemPrompt = loadPrompt("replan_v1.md");

  if (!client) {
    return generateLocalFallbackReplan(params);
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(params) },
      ],
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    return ReplanPatchSchema.parse(parsed);
  } catch (e) {
    console.warn("Adaptive replan failed, falling back to local patch:", e);
    return generateLocalFallbackReplan(params);
  }
}

/**
 * Diagnostic Engine: Progressive Domain-Specific Questions
 */
export async function generateDiagnosticQuestions(topic: string): Promise<DiagnosticQuestion[]> {
  const client = getOpenAIClient();
  const systemPrompt = loadPrompt("diagnostic_v1.md");

  if (!client) {
    return generateLocalDiagnosticQuestions(topic);
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate 5 progressive diagnostic questions for: "${sanitizeInput(topic, 100)}" spanning Beginner, Some experience, Intermediate, and Advanced.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    return (parsed.questions || []).map((q: any, i: number) => ({
      id: `diag_${i + 1}`,
      levelTarget: q.levelTarget || "Intermediate",
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      rationale: q.rationale,
    }));
  } catch (err) {
    console.warn("Diagnostic LLM generation notice, using deterministic domain evaluator questions:", err);
    return generateLocalDiagnosticQuestions(topic);
  }
}

/**
 * Domain-specific deterministic diagnostic question generator
 */
function generateLocalDiagnosticQuestions(topic: string): DiagnosticQuestion[] {
  const category = detectDomainCategory(topic, "");

  if (category === "languages") {
    return [
      {
        id: "d1",
        levelTarget: "Beginner",
        question: `When learning ${topic}, what is the most critical foundation for accurate pronunciation and listening comprehension?`,
        options: [
          "Internalizing phonetic articulation and vowel consistency before memorizing long vocabulary lists",
          "Translating every word literally into your native language word-by-word",
          "Reading advanced literature with a bilingual dictionary",
          "Ignoring accent and pronunciation until after mastering grammar",
        ],
        correctIndex: 0,
        rationale: "Phonetic clarity prevents fossilized pronunciation errors and powers auditory comprehension.",
      },
      {
        id: "d2",
        levelTarget: "Some experience",
        question: `In ${topic}, what is the core function of grammatical verb conjugation?`,
        options: [
          "Modifying verb endings or auxiliary structures to reflect tense, person, aspect, and mood",
          "Translating noun gender arbitrarily into plural forms",
          "Replacing adjectives with adverbial clauses",
          "Adding punctuation marks to denote sentence stress",
        ],
        correctIndex: 0,
        rationale: "Conjugation governs syntactic clarity and temporal orientation in natural speech.",
      },
      {
        id: "d3",
        levelTarget: "Intermediate",
        question: `When transitioning from textbook study to spontaneous spoken dialogue in ${topic}, which practice accelerates fluency?`,
        options: [
          "Thinking directly in the target language and circumlocuting around unfamiliar words",
          "Mentally drafting full sentences in English and translating them before speaking",
          "Memorizing vocabulary exclusively in isolated alphabetical flashcard decks",
          "Pausing every conversation until exact dictionary translations are confirmed",
        ],
        correctIndex: 0,
        rationale: "Bypassing intermediate translation builds reflexive neural pathways for natural speech.",
      },
      {
        id: "d4",
        levelTarget: "Advanced",
        question: `How do modal auxiliaries, the subjunctive mood, or indirect conditional phrasing function in ${topic}?`,
        options: [
          "They express hypotheticals, subjective emotion, doubt, and social politeness nuance",
          "They are obsolete grammatical relics with no modern conversational usage",
          "They only apply to irregular irregular nouns in formal academic papers",
          "They indicate past completed events in narrative writing",
        ],
        correctIndex: 0,
        rationale: "Nuanced moods express intentionality, epistemic certainty, and social register.",
      },
      {
        id: "d5",
        levelTarget: "Advanced",
        question: `What distinguishes native-level conversational fluency in ${topic} from advanced intermediate speech?`,
        options: [
          "Effortless grasp of colloquial reductions, cultural idioms, humor, and pragmatic context",
          "Never making a single grammatical slip or pause during rapid dialogue",
          "Using exclusively archaic or formal literary vocabulary in casual chat",
          "Relying strictly on phonetic spelling without understanding slang",
        ],
        correctIndex: 0,
        rationale: "Pragmatic and socio-linguistic competence defines true communicative mastery.",
      },
    ];
  }

  if (category === "music_audio") {
    return [
      {
        id: "d1",
        levelTarget: "Beginner",
        question: `What is the primary physical invariant for developing clean tone and avoiding injury in ${topic}?`,
        options: [
          "Relaxed neutral posture with minimal grip tension and precise fingertip placement close to frets/keys",
          "Squeezing the instrument with maximum grip force to press as hard as possible",
          "Collapsing the wrist and keeping knuckles locked straight",
          "Striking notes aggressively to compensate for uneven finger pressure",
        ],
        correctIndex: 0,
        rationale: "Neutral ergonomics prevent repetitive strain injury (RSI) and maximize acoustic resonance.",
      },
      {
        id: "d2",
        levelTarget: "Some experience",
        question: `In fundamental music theory, what distinguishes a major scale from a natural minor scale?`,
        options: [
          "The specific interval step pattern: the minor scale lowers the 3rd, 6th, and 7th degrees by a half-step",
          "A minor scale has twice as many notes as a major scale",
          "Major scales can only be played at fast tempos, while minor scales are slow",
          "Major scales do not contain any whole-step intervals",
        ],
        correctIndex: 0,
        rationale: "Scale degrees and interval formulas define harmonic color and emotional quality.",
      },
      {
        id: "d3",
        levelTarget: "Intermediate",
        question: `When executing chord progressions in ${topic}, what technique creates smooth, musical transitions between voicings?`,
        options: [
          "Voice leading and maintaining common anchor or pivot notes between chord shapes",
          "Lifting all fingers off the instrument completely between every single chord",
          "Strumming without a metronome to avoid constraint",
          "Only playing root-position bar chords without inversions",
        ],
        correctIndex: 0,
        rationale: "Voice leading minimizes finger travel and preserves harmonic continuity across changes.",
      },
      {
        id: "d4",
        levelTarget: "Advanced",
        question: `In functional harmonic analysis, what is the role of secondary dominants (e.g., V/V or V/ii)?`,
        options: [
          "Temporarily tonicizing a diatonic chord other than the home key to build harmonic tension",
          "Replacing the rhythm section with a syncopated drum fill",
          "Modulating permanently into an unrelated chromatic key signature",
          "Eliminating the need for a tonic chord in the resolution",
        ],
        correctIndex: 0,
        rationale: "Secondary dominants inject forward momentum and chromatic richness into diatonic harmony.",
      },
      {
        id: "d5",
        levelTarget: "Advanced",
        question: `How do micro-timing (groove/pocket) and dynamic touch expressiveness influence musical phrasing?`,
        options: [
          "Intentional velocity nuances and slight behind/ahead displacement bring mechanical notes to life",
          "Total quantization to a 100% rigid grid makes all music sound superior",
          "Dynamic variation should be eliminated in favor of constant peak volume",
          "Phrasing is purely determined by pitch, independent of articulation and dynamics",
        ],
        correctIndex: 0,
        rationale: "Micro-dynamics and groove nuance separate expressive musicianship from robotic playback.",
      },
    ];
  }

  if (category === "design_ui") {
    return [
      {
        id: "d1",
        levelTarget: "Beginner",
        question: `What is the primary objective of visual hierarchy in ${topic}?`,
        options: [
          "Guiding the user's attention sequentially to the most important content and primary calls to action",
          "Filling every available square pixel of whitespace with graphic ornaments",
          "Using as many contrasting typeface families as possible to increase visual variety",
          "Hiding navigation menus to make the screen look minimalist",
        ],
        correctIndex: 0,
        rationale: "Hierarchy reduces cognitive load and directs user flow toward core task completion.",
      },
      {
        id: "d2",
        levelTarget: "Some experience",
        question: `Why is an 8pt or 4pt spatial grid system standard in modern UI design?`,
        options: [
          "It establishes mathematical visual rhythm, consistent component spacing, and clean multi-density rendering",
          "It is the only grid format that graphics software permits",
          "It eliminates the need for typography scaling rules",
          "It forces all screen resolutions to be multiples of 100px",
        ],
        correctIndex: 0,
        rationale: "Modular grids enable systematic spacing and effortless developer handoff.",
      },
      {
        id: "d3",
        levelTarget: "Intermediate",
        question: `According to WCAG AA accessibility standards, what is the required contrast ratio for standard body text against its background?`,
        options: [
          "At least 4.5:1 (or 3:1 for large text at 18pt+ / 14pt bold)",
          "1.5:1 for subtle minimalist aesthetics",
          "10:1 strictly for all typography regardless of size",
          "Color contrast does not matter if the font size is above 12px",
        ],
        correctIndex: 0,
        rationale: "WCAG contrast standards ensure legibility for users with visual impairments.",
      },
      {
        id: "d4",
        levelTarget: "Advanced",
        question: `How do design tokens improve scalability across multi-brand design systems in ${topic}?`,
        options: [
          "They store visual decisions (colors, spacing, elevations) as semantic key-value data shared directly with code",
          "They convert all bitmap assets into SVG vector graphics automatically",
          "They enforce that all products look identical regardless of branding",
          "They replace designers by generating final production CSS without review",
        ],
        correctIndex: 0,
        rationale: "Design tokens bridge design tools and engineering codebases with single-source-of-truth semantics.",
      },
      {
        id: "d5",
        levelTarget: "Advanced",
        question: `When conducting usability testing on a prototype, how do you differentiate usability defects from subjective preference?`,
        options: [
          "By measuring quantitative task completion rate, time-on-task, and error frequency rather than aesthetic comments",
          "By asking users if they like the color palette and following majority vote",
          "By trusting internal stakeholder intuition over user test recordings",
          "By assuming any user confusion is caused by user error rather than interface friction",
        ],
        correctIndex: 0,
        rationale: "Empirical behavioral observation identifies structural usability friction.",
      },
    ];
  }

  if (category === "frontend_web") {
    return [
      {
        id: "d1",
        levelTarget: "Beginner",
        question: `In web development, what is the role of the CSS Box Model?`,
        options: [
          "It calculates an element's total footprint using content, padding, border, and margin layers",
          "It packages JavaScript dependencies into bundle files",
          "It defines database schemas for frontend state",
          "It handles cross-origin HTTP request security policies",
        ],
        correctIndex: 0,
        rationale: "The Box Model governs layout geometry and spatial relationships in the browser DOM.",
      },
      {
        id: "d2",
        levelTarget: "Some experience",
        question: `Why is immutable state management essential in reactive UI frameworks like React?`,
        options: [
          "It allows shallow reference comparisons to determine if component subtrees need to re-render",
          "It stores all variables permanently in localStorage",
          "It prevents JavaScript from running garbage collection cycles",
          "It forces all network requests to be synchronous",
        ],
        correctIndex: 0,
        rationale: "Immutable state updates enable predictable rendering triggers and prevent silent mutation bugs.",
      },
      {
        id: "d3",
        levelTarget: "Intermediate",
        question: `What is the primary architectural penalty of client-side waterfall data fetching in deeply nested components?`,
        options: [
          "Child components cannot initiate data fetching until their parents finish loading and rendering",
          "It causes the database server to shut down immediately",
          "It permanently disables browser caching across tabs",
          "It forces the browser to recompile CSS stylesheets on every click",
        ],
        correctIndex: 0,
        rationale: "Sequential request chains amplify network latency and delay First Contentful Paint.",
      },
      {
        id: "d4",
        levelTarget: "Advanced",
        question: `What is the primary cause of a React hydration mismatch error in Server-Side Rendered (SSR) applications?`,
        options: [
          "Discrepancy between server-rendered HTML and client-reconstructed DOM (e.g., timestamps or browser-only APIs)",
          "Running the application on an HTTP/1.1 connection instead of HTTP/2",
          "Having more than 10 components on a single screen",
          "Using TypeScript instead of standard JavaScript in production",
        ],
        correctIndex: 0,
        rationale: "Hydration requires deterministic DOM parity between server render and client initial tree.",
      },
      {
        id: "d5",
        levelTarget: "Advanced",
        question: `How do modern Core Web Vitals (LCP, INP, CLS) measure real user experience?`,
        options: [
          "By quantifying perceived loading speed (LCP), interaction responsiveness (INP), and visual layout stability (CLS)",
          "By calculating total line count of TypeScript code deployed to production",
          "By counting how many unique visitors land on the homepage per day",
          "By verifying that all CSS animations run at exactly 120 FPS",
        ],
        correctIndex: 0,
        rationale: "Core Web Vitals capture user-centric performance metrics rather than synthetic server times.",
      },
    ];
  }

  if (category === "data_ai") {
    return [
      {
        id: "d1",
        levelTarget: "Beginner",
        question: `Why is vectorized computation in NumPy/Pandas substantially faster than native Python for-loops?`,
        options: [
          "It executes contiguous memory operations in optimized C/BLAS routines without Python interpreter overhead",
          "It skips data validation and accepts corrupted data silently",
          "It converts all numbers into strings before computation",
          "It automatically spreads all operations across a quantum computer",
        ],
        correctIndex: 0,
        rationale: "SIMD vectorization and contiguous C memory layouts bypass Python object boxing overhead.",
      },
      {
        id: "d2",
        levelTarget: "Some experience",
        question: `What fundamentally distinguishes supervised from unsupervised machine learning in ${topic}?`,
        options: [
          "Supervised learning trains on labeled input-output pairs; unsupervised discovers latent patterns without target labels",
          "Supervised learning uses neural networks while unsupervised only uses linear regression",
          "Unsupervised learning never requires any data preprocessing or cleaning",
          "Supervised models can never make prediction errors in production",
        ],
        correctIndex: 0,
        rationale: "Target label presence dictates learning paradigms, cost functions, and validation metrics.",
      },
      {
        id: "d3",
        levelTarget: "Intermediate",
        question: `What constitutes data leakage in a predictive modeling pipeline?`,
        options: [
          "Allowing information from the validation/test set to influence feature scaling, encoding, or training",
          "Writing dataset records to an unencrypted CSV file on disk",
          "Removing outliers from the training distribution",
          "Training a model with too many features relative to sample size",
        ],
        correctIndex: 0,
        rationale: "Data leakage produces unrealistically optimistic validation metrics that collapse in production.",
      },
      {
        id: "d4",
        levelTarget: "Advanced",
        question: `How does the bias-variance tradeoff govern model generalization on unseen data?`,
        options: [
          "High bias causes underfitting from overly rigid assumptions; high variance captures noise and causes overfitting",
          "High bias and high variance both guarantee zero prediction error",
          "Bias only applies to linear models, while variance only applies to decision trees",
          "Reducing model parameters always increases variance while decreasing bias",
        ],
        correctIndex: 0,
        rationale: "Optimal model capacity balances bias underfitting against variance oversensitivity to training noise.",
      },
      {
        id: "d5",
        levelTarget: "Advanced",
        question: `In deep neural network training, what core stabilization benefit does Layer/Batch Normalization provide?`,
        options: [
          "It smooths the loss landscape and reduces internal covariate shift, allowing higher learning rates",
          "It guarantees that backpropagation gradients never vanish under any activation function",
          "It eliminates the need for activation functions entirely",
          "It reduces training dataset memory consumption by 90%",
        ],
        correctIndex: 0,
        rationale: "Normalization standardizes layer activations, stabilizing gradient flow across deep networks.",
      },
    ];
  }

  // Default universal fallback for cloud, security, systems, business, and general topics
  return [
    {
      id: "d1",
      levelTarget: "Beginner",
      question: `In the discipline of ${topic}, what is the fundamental first principle for establishing baseline competency?`,
      options: [
        "Deconstructing the core mechanics into discrete sub-skills and mastering baseline form before adding complexity",
        "Immediately attempting advanced production projects without understanding foundational primitives",
        "Memorizing terminology without engaging in hands-on practice",
        "Relying entirely on automated tools without understanding their underlying mechanisms",
      ],
      correctIndex: 0,
      rationale: "Foundational mental models and deliberate practice establish durable skill acquisition.",
    },
    {
      id: "d2",
      levelTarget: "Some experience",
      question: `When executing standard workflows in ${topic}, how do you structure components for maintainability and reliability?`,
      options: [
        "Separate domain logic from external dependencies with clear, explicit interface boundaries",
        "Couple all configuration parameters directly inside runtime execution blocks",
        "Avoid using conventions, linting, or schemas to maximize personal flexibility",
        "Bypass testing whenever deadlines are tight",
      ],
      correctIndex: 0,
      rationale: "Modular separation of concerns minimizes blast radius and prevents brittle coupling.",
    },
    {
      id: "d3",
      levelTarget: "Intermediate",
      question: `What is the primary indicator of an intermediate plateau in ${topic}, and how is it overcome?`,
      options: [
        "Relying on comfortable autopilot; overcome by targeted deliberate practice on specific edge cases and weaknesses",
        "Working more hours without changing methods or analyzing errors",
        "Switching toolchains every week to stay on the bleeding edge",
        "Blaming external constraints instead of auditing technique and execution data",
      ],
      correctIndex: 0,
      rationale: "Deliberate practice with fast feedback loops breaks plateaus.",
    },
    {
      id: "d4",
      levelTarget: "Advanced",
      question: `How do top practitioners in ${topic} handle unexpected failures or high-pressure stress scenarios?`,
      options: [
        "Rely on structured diagnostics, graceful degradation, and calm root-cause analysis",
        "Make panicked trial-and-error adjustments without telemetry or baseline measurements",
        "Suppress error signals to maintain the appearance of normalcy",
        "Immediately restart the entire system without inspecting state logs",
      ],
      correctIndex: 0,
      rationale: "Resilient systems and practitioners operate on structured observation and controlled mitigation.",
    },
    {
      id: "d5",
      levelTarget: "Advanced",
      question: `What distinguishes world-class mastery in ${topic} from standard professional competence?`,
      options: [
        "Deep intuitive command of edge cases, cross-disciplinary synthesis, and robust performance under constraint",
        "Knowing every trivial trivia fact without practical execution capability",
        "Never needing to inspect documentation or consult peers",
        "Building overly complex architectures to prove technical sophistication",
      ],
      correctIndex: 0,
      rationale: "True mastery delivers elegant simplicity, high leverage, and resilience under extreme constraints.",
    },
  ];
}

/**
 * Domain-specific checkpoint questions generator
 */
function generateLocalFallbackCheckpoints(
  sessionTitle: string,
  concepts: string[],
  goal?: string
): CheckpointQuestion[] {
  const c1 = concepts[0] || "Foundational Principle";
  const c2 = concepts[1] || "Core Execution";
  const category = detectDomainCategory(goal || sessionTitle, concepts.join(" "));

  if (category === "languages") {
    return [
      {
        id: "chk_1",
        type: "multiple_choice",
        question: `Which fundamental principle governs the practical application of ${c1}?`,
        options: [
          `Internalizing grammatical patterns in context rather than word-for-word translation`,
          `Memorizing dictionary entries in strict alphabetical order without sentences`,
          `Ignoring verb conjugation and relying entirely on hand gestures`,
          `Speaking only in the present tense to avoid grammatical complexity`,
        ],
        correctIndex: 0,
        explanation: `Natural language fluency develops through contextual pattern recognition and active production.`,
      },
      {
        id: "chk_2",
        type: "multiple_choice",
        question: `When applying ${c2} during conversational speech, what strategy ensures clear communication?`,
        options: [
          `Focus on phonetic clarity, rhythm, and circumlocution around unfamiliar vocabulary`,
          `Pause speech completely until you verify an exact translation in a dictionary`,
          `Speak as fast as possible regardless of vowel and consonant distortion`,
          `Substitute English words whenever unsure of target grammar`,
        ],
        correctIndex: 0,
        explanation: `Circumlocution and phonetic clarity maintain conversational flow and comprehension.`,
      },
      {
        id: "chk_3",
        type: "practical_task",
        question: `Active Speech Drill: Formulate and vocalize 2 original sentences applying ${c1}.`,
        options: [
          `Vocalized both sentences aloud with correct pronunciation and grammatical agreement`,
          `Read silently in your head without speaking aloud`,
          `Skipped sentence construction due to uncertainty`,
          `Relied on automated translation software without personal recall`,
        ],
        correctIndex: 0,
        taskCriteria: `Speak 2 complete sentences demonstrating ${c1} aloud with clean pronunciation.`,
        explanation: `Vocal production engages motor muscle memory and auditory feedback loops essential for fluency.`,
      },
    ];
  }

  if (category === "music_audio") {
    return [
      {
        id: "chk_1",
        type: "multiple_choice",
        question: `What ergonomic invariant is essential for clean execution of ${c1}?`,
        options: [
          `Maintaining neutral wrist posture, relaxed shoulders, and fingertip placement close to frets/keys`,
          `Squeezing with maximum grip force to press the strings or keys as hard as possible`,
          `Locking the wrist at a sharp angle to reach distant positions`,
          `Allowing adjacent fingers to collapse and unintentionally mute neighboring notes`,
        ],
        correctIndex: 0,
        explanation: `Neutral wrist alignment prevents muscle fatigue, tendon strain, and eliminates accidental muting.`,
      },
      {
        id: "chk_2",
        type: "multiple_choice",
        question: `In the context of ${c2}, how do you ensure consistent rhythmic timing?`,
        options: [
          `Subdivide the beat mentally and practice with a steady metronome or backing track`,
          `Speed up during familiar passages and slow down during difficult transitions`,
          `Ignore time signatures and play purely by random impulse`,
          `Rely exclusively on visual tuner feedback rather than auditory listening`,
        ],
        correctIndex: 0,
        explanation: `Subdivision and metronome practice internalize internal pulse and groove precision.`,
      },
      {
        id: "chk_3",
        type: "practical_task",
        question: `Hands-on Practice: Play through the exercise for ${c1} cleanly at a relaxed tempo.`,
        options: [
          `Played 4 clean repetitions in time with zero fret buzz or dropped notes`,
          `Played quickly with multiple buzzing or muted notes`,
          `Skipped hands-on execution and only read the notation`,
          `Stopped after the first mistake without repeating`,
        ],
        correctIndex: 0,
        taskCriteria: `Perform the exercise on your instrument smoothly 4 times consecutively without errors.`,
        explanation: `Deliberate repetition builds myelin and reliable muscle memory on the instrument.`,
      },
    ];
  }

  if (category === "design_ui") {
    return [
      {
        id: "chk_1",
        type: "multiple_choice",
        question: `What is the core user experience objective when structuring ${c1}?`,
        options: [
          `Establishing clear visual hierarchy that guides user attention to primary actions`,
          `Adding ornamental illustrations to every empty space on the screen`,
          `Using unpredictable navigation patterns to make the interface feel mysterious`,
          `Ignoring typography scale and setting all text to identical sizing`,
        ],
        correctIndex: 0,
        explanation: `Clear visual hierarchy minimizes cognitive load and empowers users to navigate intuitively.`,
      },
      {
        id: "chk_2",
        type: "multiple_choice",
        question: `When auditing ${c2} for accessibility, which standard must be verified?`,
        options: [
          `WCAG AA contrast ratios (at least 4.5:1 for body copy) and clear focus states`,
          `Low-contrast light gray text on white backgrounds for aesthetic minimalism`,
          `Hiding interactive click targets so users must hover to discover them`,
          `Relying solely on color hue to communicate error states`,
        ],
        correctIndex: 0,
        explanation: `WCAG compliance guarantees legibility, keyboard operability, and inclusive usability.`,
      },
      {
        id: "chk_3",
        type: "practical_task",
        question: `Design Verification: Audit your component layout for ${c1} against spatial grid constraints.`,
        options: [
          `Verified consistent 8pt/4pt spacing, auto-layout responsiveness, and alignment`,
          `Eyeballed pixel margins without using an established spacing scale`,
          `Fixed absolute pixel coordinates that break on different screen sizes`,
          `Omitted hover, active, and disabled interactive component states`,
        ],
        correctIndex: 0,
        taskCriteria: `Inspect component frame in Figma or CSS, confirming padding and margins align with the design system.`,
        explanation: `Systematic spatial grids ensure visual rhythm, harmony, and frictionless engineering handoff.`,
      },
    ];
  }

  // Universal high-yield technical and general fallback
  return [
    {
      id: "chk_1",
      type: "multiple_choice",
      question: `Which fundamental principle governs the reliable application of ${c1}?`,
      options: [
        `Explicit separation of concerns with predictable state transitions and bounded side effects`,
        `Implicit global mutable variables shared without boundary checks`,
        `Ignoring edge-case validation on incoming data payloads`,
        `Arbitrary synchronous blocking operations without timeout bounds`,
      ],
      correctIndex: 0,
      explanation: `Explicit boundaries and decoupled state prevent cascading failures and simplify verification.`,
    },
    {
      id: "chk_2",
      type: "multiple_choice",
      question: `When troubleshooting unexpected anomalies during ${c2}, what is the recommended protocol?`,
      options: [
        `Isolate the fault domain with structured diagnostics and test against established baseline invariants`,
        `Silently ignore errors and hope transient issues resolve themselves`,
        `Make random code or procedural modifications without measuring outcomes`,
        `Bypass validation checks entirely to force execution through`,
      ],
      correctIndex: 0,
      explanation: `Structured diagnostics and root-cause isolation prevent compounding errors and preserve stability.`,
    },
    {
      id: "chk_3",
      type: "practical_task",
      question: `Hands-on Verification: Implement and verify ${c1} in your local workspace.`,
      options: [
        `Executed verification routine and confirmed all core requirements pass cleanly`,
        `Skipped validation due to time constraints`,
        `Only verified superficially without checking edge cases`,
        `Modified production workflows without running local tests`,
      ],
      correctIndex: 0,
      taskCriteria: `Execute the session verification steps and verify all assertions and criteria pass.`,
      explanation: `Hands-on execution validates theoretical comprehension and surfaces subtle practical edge cases.`,
    },
  ];
}

function generateLocalFallbackReplan(params: any): ReplanPatch {
  return {
    explanation: `Pacing adjusted based on user feedback (${params.triggerReason}). Preserved all ${params.completedSessionTitles.length} completed sessions while reinforcing prerequisite bridges for remaining weeks.`,
    modifications: [
      {
        type: "modify",
        phaseId: params.phases[0]?.id || "phase_1",
        weekNumber: 1,
        changes: "Reinforced foundational exercises, clarified conceptual models, and adjusted weekly session pacing.",
      },
    ],
  };
}

/**
 * Generate in-depth Theoretical Discourse via GPT-4o with Domain-Aware Synthesis Fallback
 */
export async function generateTheoreticalDiscourse(params: {
  sessionTitle: string;
  objective: string;
  concepts: string[];
  weekTheme?: string;
  level?: string;
  goal?: string;
  speciality?: string;
}): Promise<TheoreticalDiscourse> {
  const client = getOpenAIClient();
  const systemPrompt = loadPrompt("discourse_v1.md");

  if (!client) {
    return generateFallbackDiscourse(params);
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.35,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Produce an authoritative, deeply rigorous theoretical discourse for this session:\n${JSON.stringify(
            params,
            null,
            2
          )}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    return TheoreticalDiscourseSchema.parse(parsed);
  } catch (err: any) {
    console.warn("GPT-4o discourse generation error, using domain fallback synthesizer:", err?.message || err);
    return generateFallbackDiscourse(params);
  }
}

/**
 * High-quality domain-aware fallback theoretical discourse generator
 */
function generateFallbackDiscourse(params: {
  sessionTitle: string;
  objective: string;
  concepts: string[];
  weekTheme?: string;
  level?: string;
  goal?: string;
  speciality?: string;
}): TheoreticalDiscourse {
  const concepts = params.concepts.length > 0 ? params.concepts : ["Core Architecture", "Execution Patterns", "Applied Mastery"];
  const c1 = concepts[0] || "Foundational Invariants";
  const c2 = concepts[1] || "Execution Semantics";
  const c3 = concepts[2] || "Resilience & Boundaries";
  const domain = detectDomainCategory(params.goal || params.sessionTitle, params.speciality || "");
  const subject = params.goal || params.sessionTitle;

  // 1. LANGUAGES (Spanish, French, German, Japanese, etc.)
  if (domain === "languages") {
    return {
      overview: `${params.sessionTitle} constitutes a cornerstone module in mastering ${subject}. This treatise deconstructs the linguistic mechanics, phonetic articulation, and cognitive models required to internalize ${c1} and ${c2}. Rather than relying on passive memorization or tedious word-for-word mental translation, fluent communication demands direct neural associations between concepts, acoustic phonetics, and contextual discourse.`,
      firstPrinciples: `At first principles, language acquisition operates through comprehensible input and active retrieval loops. The cognitive bottleneck in second language acquisition is working memory saturation caused by translating words back to a native tongue. By grounding ${c1} in communicative context and automated muscle memory, the learner transitions from rule-based calculation to spontaneous, reflexive language production.`,
      mentalModel: `Think of ${c1} not as static grammar rules in a textbook, but as an adaptive reflex engine: words and syntactic structures are rapid acoustic building blocks assembled seamlessly in response to real-time communicative intent.`,
      sections: [
        {
          heading: `1. Phonetic Precision & Syntactic Foundations of ${c1}`,
          body: `Mastering ${c1} requires developing acoustic acuity and muscle coordination in the vocal tract. Every language possesses unique vowel formant frequencies, consonant aspiration patterns, and syllable cadences. In ${subject}, failing to produce exact vowel sounds creates comprehension barriers even when grammatical structure is flawless. Practicing active shadowing and exaggerated articulation establishes neuro-muscular pathways for clean, natural speech.`,
          keyTakeaways: [
            `Consistent vowel purity and syllable timing form the basis of natural intelligibility.`,
            `Auditory shadowing drills train your ear to parse connected native speech in real time.`,
          ],
          codeExample: {
            language: "markdown",
            title: `Structural Linguistic Formula & Pattern Drills for ${c1}`,
            code: `### Conversational Pattern & Conjugation Matrix

| Person / Subject | Root Stem | Functional Ending | Contextual Sentence Example | English Functional Meaning |
| :--- | :--- | :--- | :--- | :--- |
| First Person (I) | [Stem] | -o / -e | "Hablo con fluidez todos los días." | I speak fluently every day. |
| Second Person (You) | [Stem] | -as / -es | "¿Comprendes la estructura básica?" | Do you understand the basic structure? |
| Third Person (He/She) | [Stem] | -a / -e | "Explica el concepto con claridad." | She explains the concept clearly. |
| Plural (We) | [Stem] | -amos / -emos | "Practicamos la pronunciación juntos."| We practice pronunciation together. |

*Core Rule: Drop the infinitive ending and append the mood/tense suffix directly to the verbal stem.*`,
            explanation: `Notice how internalizing the stem modification enables immediate, reflexive verb production without pausing to calculate grammatical tables.`,
          },
        },
        {
          heading: `2. Structural Composition and Contextual Fluidity of ${c2}`,
          body: `As your vocabulary expands, ${c2} dictates how ideas are connected across compound clauses and temporal frames. Natural speech relies on discourse markers, prepositional collocation, and circumlocution. When encountering an unknown word in rapid dialogue, fluent speakers do not freeze; they employ descriptive synonyms and contextual bridges to maintain momentum.`,
          keyTakeaways: [
            `Discourse connectors bridge thoughts smoothly and create natural conversational cadence.`,
            `Circumlocution is an essential fluency skill that eliminates conversational deadlocks.`,
          ],
        },
        {
          heading: `3. Idiomatic Nuance and Cultural Pragmatics (${c3})`,
          body: `Language is inextricably linked to cultural pragmatics. In ${c3}, literal meaning frequently diverges from communicative intent. Recognizing social registers, formal versus informal address, and culturally rooted expressions prevents social friction and demonstrates genuine linguistic maturity.`,
          keyTakeaways: [
            `Respect social register (polite vs familiar) to match communicative context.`,
            `Learn idioms as single, indivisible lexical chunks rather than translating constituent words.`,
          ],
        },
      ],
      pitfalls: [
        {
          antipattern: `Mental Word-for-Word Translation from Native Language`,
          consequence: `Creates cognitive exhaustion, unnatural word order, and awkward delays in spontaneous conversation.`,
          solution: `Anchor new expressions directly to sensory images, physical actions, and target-language definitions.`,
        },
        {
          antipattern: `Passive Recognition Without Active Vocal Production`,
          consequence: `You understand written text perfectly but freeze completely when required to vocalize spontaneous sentences.`,
          solution: `Perform daily vocal shadowing, record your pronunciation, and practice unscripted 2-minute speech drills.`,
        },
      ],
      systemDesignImplications: `Mastering ${c1} and ${c2} eliminates conversational latency, reduces cognitive fatigue during prolonged immersion, and establishes the neuro-linguistic baseline required for professional fluency.`,
      reflectionPrompt: `Can you deliver an unscripted 60-second explanation of your daily routine in ${subject} applying ${c1} without pausing to consult a dictionary or translating in your head?`,
    };
  }

  // 2. MUSIC & AUDIO (Guitar, Piano, Theory, Singing)
  if (domain === "music_audio") {
    return {
      overview: `${params.sessionTitle} represents a pivotal technical milestone in mastering ${subject}. This treatise unpacks the acoustic physics, harmonic theory, and physiological ergonomics necessary to execute ${c1} and ${c2} with clarity and expressive touch. True musicianship harmonizes intellectual comprehension of harmonic intervals with relaxed, effortless physical muscle memory.`,
      firstPrinciples: `At first principles, musical instruments are acoustic resonators governed by harmonic overtone series, mathematical interval ratios, and ergonomic mechanical leverage. The physical limit in performance is muscular tension: excess grip force dampens acoustic resonance and creates micro-timing latency. By calibrating touch sensitivity and internalizing harmonic intervals, the player achieves effortless expressive command.`,
      mentalModel: `Think of your instrument as an extension of the human voice: breath, posture, and fingertip articulation translate internal musical imagination directly into expressive acoustic waves.`,
      sections: [
        {
          heading: `1. Physical Ergonomics and Motor Precision of ${c1}`,
          body: `Executing ${c1} cleanly requires absolute economy of motion. When fretting, picking, or depressing keys, any excessive muscular contraction in the forearm, wrist, or shoulder radiates into mechanical stiffness. Positioning fingers perpendicular to the playing surface immediately adjacent to the fretwire or key pivot maximizes leverage while requiring a fraction of the physical force.`,
          keyTakeaways: [
            `Maintain neutral wrist alignment and eliminate extraneous shoulder and thumb tension.`,
            `Position fingertips immediately behind fretwires/keys to eliminate buzzing with minimum pressure.`,
          ],
          codeExample: {
            language: "markdown",
            title: `Harmonic Voicing & Fretboard/Key Architecture for ${c1}`,
            code: `### Harmonic Interval Blueprint & Chord Voicing

Root Note: [Tonic] | Quality: Major / Minor / Dominant 7th
Interval Formula: 1 (Root) - 3 (Mediant) - 5 (Dominant) - b7 (Subtonic)

TAB / Chord Grid Representation:
E |---[ 3 ]--- (Root Note: G)
B |---[ 3 ]--- (5th Degree: D)
G |---[ 0 ]--- (Root Note: G)
D |---[ 0 ]--- (5th Degree: D)
A |---[ 2 ]--- (3rd Degree: B)
E |---[ 3 ]--- (Root Note: G)

*Fingering Strategy: Anchor ring finger on high strings to maintain pivot stability.*`,
            explanation: `Notice how anchoring common chord tones across transitions dramatically reduces hand travel and preserves clean harmonic voice leading.`,
          },
        },
        {
          heading: `2. Harmonic Progression and Voice Leading in ${c2}`,
          body: `In musical composition and accompaniment, ${c2} governs how chords move through time. Diatonic harmony relies on tension and resolution: tonic stability moves toward subdominant expansion and dominant tension before resolving home. Mastering voice leading ensures that individual voices travel the shortest possible distance between chords, creating smooth, professional musical accompaniment.`,
          keyTakeaways: [
            `Voice leading minimizes physical hand travel and creates sophisticated, flowing chord progressions.`,
            `Subdivide beats internally to anchor your tempo against a rigid internal rhythmic grid.`,
          ],
        },
        {
          heading: `3. Dynamic Articulation and Expressive Touch (${c3})`,
          body: `What separates mechanical execution from artistic mastery in ${c3} is dynamic range and micro-timing. Intentional variations in pick/keystroke velocity, subtle vibrato, and dynamic contrasts imbue phrases with emotional resonance.`,
          keyTakeaways: [
            `Vary pick and finger velocity deliberately to emphasize syncopated accents and phrase peaks.`,
            `Practice micro-timing against a click: lock into the center of the pocket without rushing.`,
          ],
        },
      ],
      pitfalls: [
        {
          antipattern: `Excessive Fretting/Hand Tension and Clamping Grip`,
          consequence: `Rapidly induces forearm fatigue, mutes adjacent resonant strings, and can lead to repetitive strain injury (RSI).`,
          solution: `Use arm weight rather than thumb squeeze to apply string pressure; practice playing with the thumb floating lightly off the neck.`,
        },
        {
          antipattern: `Practicing Complex Passages Without a Metronome`,
          consequence: `Reinforces erratic tempo fluctuations, where difficult chord changes slow down and easy licks speed up.`,
          solution: `Always dial the metronome down to 60 BPM; only advance tempo when you can play 4 consecutive repetitions with zero errors.`,
        },
      ],
      systemDesignImplications: `Mastering ${c1} and ${c2} transforms physical execution from an arduous physical hurdle into an intuitive reflex, unlocking effortless improvisation and musical interpretation.`,
      reflectionPrompt: `When playing your primary repertoire piece at 75% tempo, can you isolate and eliminate the exact instant where hand tension spikes during transitions?`,
    };
  }

  // 3. UI/UX DESIGN (Figma, Systems, Tokens, Research)
  if (domain === "design_ui") {
    return {
      overview: `${params.sessionTitle} constitutes an essential structural discipline in ${subject}. This treatise explores the perceptual psychology, spatial systems, and component architectures required to execute ${c1} and ${c2}. Exceptional interface design merges aesthetic clarity with cognitive affordance, ensuring that every visual decision purposefully reduces friction and accelerates user goal completion.`,
      firstPrinciples: `At first principles, user interfaces are visual communication layers that bridge human cognitive models with underlying digital data structures. Visual cognitive load follows Gestalt grouping principles: proximity, similarity, and enclosure dictate how information is parsed before conscious thought occurs. By anchoring ${c1} to mathematical spatial scales and accessible contrast invariants, interfaces feel intuitively legible and effortless.`,
      mentalModel: `Think of UI architecture as an ergonomic physical cockpit: every control has distinct spatial affordance, obvious feedback states, and strict hierarchy calibrated to human perceptual limits.`,
      sections: [
        {
          heading: `1. Visual Hierarchy & Spatial Grid Foundations of ${c1}`,
          body: `The foundation of ${c1} rests upon the 8-point spatial grid. When spatial margins, component heights, and padding follow an 8pt modular scale, visual rhythm becomes cohesive across screen breakpoints. Arbitrary pixel dimensions force visual disarray and increase engineering friction. Pair this with a modular typography scale (e.g., Minor Third 1.2 or Major Second 1.125) to create unmistakable informational hierarchy.`,
          keyTakeaways: [
            `Strict 8pt/4pt spatial increments establish subconscious order and seamless developer handoff.`,
            `Typographical scale and font weight must differentiate metadata, body copy, and section headers instantly.`,
          ],
          codeExample: {
            language: "css",
            title: `Design Token Architecture & Spatial Variables for ${c1}`,
            code: `:root {
  /* Spatial System: 8-Point Modular Scale */
  --space-1: 0.25rem; /* 4px (micro) */
  --space-2: 0.5rem;  /* 8px (tight) */
  --space-3: 0.75rem; /* 12px (compact) */
  --space-4: 1.0rem;  /* 16px (standard) */
  --space-6: 1.5rem;  /* 24px (loose) */
  --space-8: 2.0rem;  /* 32px (section) */

  /* Typography Modular Scale (1.25 Major Third) */
  --text-xs: 0.75rem;   /* 12px */
  --text-sm: 0.875rem;  /* 14px */
  --text-base: 1.0rem;  /* 16px */
  --text-lg: 1.25rem;   /* 20px */
  --text-xl: 1.563rem;  /* 25px */
  --text-2xl: 1.953rem; /* 31px */

  /* Accessible Semantic Color Tokens (WCAG AA Compliant) */
  --color-surface-base: #0f172a;
  --color-surface-elevated: #1e293b;
  --color-text-primary: #f8fafc;   /* 14.8:1 contrast on surface-base */
  --color-text-muted: #94a3b8;     /* 5.2:1 contrast on surface-base */
  --color-accent-interactive: #3b82f6;
}`,
            explanation: `Notice how semantic design tokens decouple visual decisions from raw hex values, allowing multi-theme dark/light mode switches with zero manual overrides.`,
          },
        },
        {
          heading: `2. Component Modularity & Interactive States of ${c2}`,
          body: `In design systems, ${c2} demands that every interactive component account for every possible state: default, hover, focused (keyboard accessible), active (pressed), disabled, and loading. Relying purely on color shifts to signify state fails accessibility; pair color with shape, icon, or label indicators to preserve clarity for colorblind users.`,
          keyTakeaways: [
            `Every interactive element must provide unmistakable feedback across all 6 interaction states.`,
            `Ensure focus indicators maintain at least 3:1 contrast against adjacent background colors.`,
          ],
        },
        {
          heading: `3. Usability Verification & Cognitive Flow (${c3})`,
          body: `Evaluating ${c3} requires empirical observation. Conducting 5 moderated usability walkthroughs uncovers 85% of critical navigational flaws. When users hesitate or misinterpret a call to action, the failure resides in interface affordance, not user competence.`,
          keyTakeaways: [
            `Measure task completion time and error rates rather than asking for subjective aesthetic opinions.`,
            `Design for the primary user goal with zero distracting visual noise on the critical path.`,
          ],
        },
      ],
      pitfalls: [
        {
          antipattern: `Subtle Gray-on-White Text and Unreachable Contrast Ratios`,
          consequence: `Fails WCAG AA standards, rendering body copy completely unreadable in outdoor glare or for visually impaired users.`,
          solution: `Enforce a minimum contrast ratio of 4.5:1 for body copy and 3:1 for large display headlines using automated Figma linter plugins.`,
        },
        {
          antipattern: `Detached Hardcoded Component Spacing in Auto-Layout`,
          consequence: `Breaks responsiveness across varying screen widths, requiring tedious manual re-work for mobile breakpoints.`,
          solution: `Use Figma Auto-Layout with responsive 'Fill container' constraints and tokenized gap variables.`,
        },
      ],
      systemDesignImplications: `A disciplined approach to ${c1} and ${c2} reduces UI design debt by 70%, accelerates engineering development cycles, and produces interfaces that feel effortless to end users.`,
      reflectionPrompt: `If a user must accomplish their primary task on a mobile device under direct sunlight in under 15 seconds, does your component hierarchy guide them with zero cognitive hesitation?`,
    };
  }

  // 4. FRONTEND WEB DEVELOPMENT (React, Next.js, TypeScript)
  if (domain === "frontend_web") {
    return {
      overview: `${params.sessionTitle} constitutes a core structural pillar in modern web application engineering. This treatise deconstructs the rendering lifecycle, state synchronization invariants, and browser execution semantics required to master ${c1} and ${c2}. Rather than viewing components as isolated templates, senior engineers must reason rigorously about client-server execution boundaries, immutable data flow, and DOM mutation costs.`,
      firstPrinciples: `At first principles, modern reactive UI systems resolve the impedance mismatch between mutable browser DOM nodes and declarative application state via continuous reconciliation. The governing constraint is the browser's 16.6ms frame budget: unnecessary re-renders, synchronous layout thrashing, and unmemoized object references directly degrade Core Web Vitals (INP and LCP). Establishing deterministic invariants around ${c1} guarantees predictable, sub-frame UI updates.`,
      mentalModel: `Think of UI components as pure mathematical projections: UI = f(State). Given identical props and state, rendering must remain completely idempotent, deterministic, and free from observable side-effects.`,
      sections: [
        {
          heading: `1. Component Architecture & State Synchronization of ${c1}`,
          body: `When architecting ${c1}, the primary mechanical consideration is where state lives and how updates propagate through the component tree. Placing state too high triggers cascading re-renders across unaffected subtrees; placing state too low creates complex prop-drilling or synchronization bugs. Colocate state as close as possible to the consumers that read it, and leverage immutable update patterns so shallow reference equality checks can bail out early.`,
          keyTakeaways: [
            `Colocate state close to consumption leaves to minimize re-render blast radiuses.`,
            `Immutable state transitions ensure shallow reference equality checks remain reliable and fast.`,
          ],
          codeExample: {
            language: "typescript",
            title: `Type-Safe, Resilient Reactive Component Pattern for ${c1}`,
            code: `"use client";

import React, { useState, useTransition, useCallback } from "react";

interface ResourceItem {
  id: string;
  label: string;
  status: "idle" | "pending" | "resolved";
}

interface ComponentProps {
  initialItems: ResourceItem[];
  onCommit: (item: ResourceItem) => Promise<void>;
}

export function ResourceController({ initialItems, onCommit }: ComponentProps) {
  const [items, setItems] = useState<ResourceItem[]>(initialItems);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Optimistic update pattern with error boundary rollback
  const handleUpdate = useCallback(async (targetId: string, newLabel: string) => {
    const previousSnapshot = [...items];

    // Optimistically apply state change
    setItems((prev) =>
      prev.map((item) =>
        item.id === targetId ? { ...item, label: newLabel, status: "pending" } : item
      )
    );

    startTransition(async () => {
      try {
        const updatedItem = { id: targetId, label: newLabel, status: "resolved" as const };
        await onCommit(updatedItem);
        setErrorMessage(null);
      } catch (err) {
        // Rollback on network or server rejection
        setItems(previousSnapshot);
        setErrorMessage("Update failed. Reverted to previous state.");
      }
    });
  }, [items, onCommit]);

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-xl">
      {errorMessage && <p className="text-red-500 text-sm font-medium">{errorMessage}</p>}
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between py-2 border-b">
          <span className={item.status === "pending" ? "opacity-50" : "opacity-100"}>
            {item.label}
          </span>
          <button
            disabled={isPending}
            onClick={() => handleUpdate(item.id, item.label + " (Updated)")}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Update
          </button>
        </div>
      ))}
    </div>
  );
}`,
            explanation: `Notice how 'useTransition' keeps the user interface responsive during asynchronous mutations, while the optimistic rollback pattern guarantees UI consistency upon network failure.`,
          },
        },
        {
          heading: `2. Routing, Server Boundaries & Data Streaming in ${c2}`,
          body: `In modern full-stack web architectures, ${c2} dictates the boundary between server execution and client hydration. Server Components eliminate client bundle bloat by executing purely on the server, streaming HTML chunks down to the client via Suspense boundaries. Understanding this boundary ensures sensitive database credentials never leak into client JavaScript bundles.`,
          keyTakeaways: [
            `Keep data fetching on the server to reduce client JavaScript bundle size and eliminate waterfall latency.`,
            `Use Suspense skeletons to stream progressive UI chunks rather than blocking on monolithic payloads.`,
          ],
        },
        {
          heading: `3. Performance Profiling & Core Web Vitals (${c3})`,
          body: `Real-world web performance in ${c3} is governed by Interaction to Next Paint (INP) and Largest Contentful Paint (LCP). Long JavaScript tasks executing on the main thread block user input. By chunking long tasks, virtualizing long lists, and debouncing rapid user events, the application maintains buttery 60 FPS fluidity.`,
          keyTakeaways: [
            `Audit main thread task duration: never execute CPU-intensive loops synchronously in user event handlers.`,
            `Virtualize lists with over 50 items to keep the total DOM node count under 1,500.`,
          ],
        },
      ],
      pitfalls: [
        {
          antipattern: `Missing Dependency Arrays and Stale Closures in Hooks`,
          consequence: `Leads to subtle race conditions, infinite re-render loops, or reading stale state snapshots from outdated renders.`,
          solution: `Strictly enforce the 'eslint-plugin-react-hooks' linter rules and use functional state setters (prev => next).`,
        },
        {
          antipattern: `Direct DOM Manipulation Bypassing Reactive State`,
          consequence: `Creates state de-synchronization where the DOM and React's virtual model diverge, triggering hydration panics.`,
          solution: `Always treat the DOM as a pure projection of declarative state; manipulate nodes through ref objects only when necessary.`,
        },
      ],
      systemDesignImplications: `Mastering ${c1} and ${c2} guarantees snappy sub-100ms INP responsiveness, optimizes search engine indexing (SEO), and produces scalable web applications capable of handling millions of interactions.`,
      reflectionPrompt: `If an API response slows from 50ms to 2,000ms under high load, does your UI handle the delay gracefully with optimistic indicators and zero frozen main-thread frames?`,
    };
  }

  // 5. DATA SCIENCE & AI (Python, Pandas, ML, PyTorch)
  if (domain === "data_ai") {
    return {
      overview: `${params.sessionTitle} constitutes a core structural pillar in data science and machine learning. This treatise establishes the mathematical foundations, vectorization invariants, and empirical validation protocols required to reason about ${c1} and ${c2}. Rather than treating algorithms as black-box APIs, practitioners must understand the deterministic loss landscapes, matrix algebra, and generalization mechanics governing modern predictive models.`,
      firstPrinciples: `At first principles, machine learning models approximate high-dimensional manifolds to map input feature representations to target probability distributions. The governing constraint is generalization error: separating true data-generating signals from stochastic noise. High model complexity leads to low bias but catastrophic variance (overfitting). By anchoring ${c1} in strict cross-validation and regularized optimization, the system achieves robust real-world inference.`,
      mentalModel: `Think of data modeling as navigating an optimization terrain: features define the coordinate space, the loss function defines the topography, and optimization algorithms seek stable minimums that generalize beyond the training map.`,
      sections: [
        {
          heading: `1. Mathematical Foundations & Vectorized Invariants of ${c1}`,
          body: `Executing ${c1} efficiently requires operating on contiguous numerical memory buffers. Native Python objects incur massive pointer indirection and interpreter overhead. Vectorized libraries (NumPy, PyTorch) leverage single-instruction multiple-data (SIMD) hardware intrinsics to perform thousands of floating-point operations in parallel. Structuring computations as matrix multiplications eliminates loop overhead and unlocks GPU acceleration.`,
          keyTakeaways: [
            `Vectorized operations leverage contiguous memory and C/BLAS routines for orders-of-magnitude speedups.`,
            `Feature transformations must preserve mathematical scaling invariants across train and test sets.`,
          ],
          codeExample: {
            language: "python",
            title: `Vectorized Pipeline & Validation Harness for ${c1}`,
            code: `import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

class RobustScalerPipeline(BaseEstimator, TransformerMixin):
    """Vectorized numerical feature scaler using median and interquartile range."""
    def __init__(self):
        self.median_ = None
        self.iqr_ = None

    def fit(self, X: np.ndarray, y=None):
        # Compute statistics exclusively on the training distribution (prevent leakage)
        self.median_ = np.median(X, axis=0)
        q75, q25 = np.percentile(X, [75, 25], axis=0)
        self.iqr_ = np.maximum(q75 - q25, 1e-8) # Epsilon prevents division by zero
        return self

    def transform(self, X: np.ndarray) -> np.ndarray:
        # Fast vectorized broadcasting across rows
        return (X - self.median_) / self.iqr_

# Demonstration: Strict separation of train and test distributions
if __name__ == "__main__":
    np.random.seed(42)
    X = np.random.randn(1000, 10)
    y = X @ np.random.randn(10) + np.random.normal(0, 0.5, 1000)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = RobustScalerPipeline()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test) # Transform test with train parameters

    assert X_train_scaled.shape == X_train.shape
    print(f"Data scaled cleanly without data leakage. Train samples: {X_train.shape[0]}")`,
            explanation: `Notice how 'fit' is strictly isolated to the training set; transforming the test set with training parameters prevents subtle data leakage that inflates validation scores.`,
          },
        },
        {
          heading: `2. Regularization, Feature Selection & Hyperparameter Tuning in ${c2}`,
          body: `When training predictive models, ${c2} dictates how complexity is constrained. Unchecked feature spaces lead to the curse of dimensionality, where data points grow sparse and distances lose discriminative meaning. Applying L1 (Lasso) and L2 (Ridge) penalties prevents weight explosion and promotes feature sparsity, ensuring the model generalizes reliably to new distributions.`,
          keyTakeaways: [
            `L1 regularization performs automatic feature selection by driving non-informative coefficients to absolute zero.`,
            `Stratified k-fold cross validation preserves class balance and provides unbiased metric estimates.`,
          ],
        },
        {
          heading: `3. Model Evaluation & Failure Mode Diagnostics (${c3})`,
          body: `Evaluating ${c3} requires moving beyond naive overall accuracy. In skewed real-world distributions, a model predicting the majority class can boast 99% accuracy while failing 100% of critical events. Practitioners must inspect precision-recall AUC, confusion matrices, and residual error distributions to detect systematic blind spots.`,
          keyTakeaways: [
            `Always evaluate against stratified PR-AUC or ROC-AUC when working with imbalanced datasets.`,
            `Analyze residual error plots to uncover non-linear relationships uncaptured by the model.`,
          ],
        },
      ],
      pitfalls: [
        {
          antipattern: `Fitting Preprocessing Transformers on the Entire Dataset`,
          consequence: `Information from the validation/test set bleeds into the training phase, yielding unrealistically optimistic metrics that fail in production.`,
          solution: `Always encapsulate preprocessing in pipelines and call 'fit' exclusively on the training split.`,
        },
        {
          antipattern: `Ignoring Feature Collinearity and Outlier Sensitivities`,
          consequence: `Unstable model coefficients, high variance in predictions, and severe degradation when exposed to production anomalies.`,
          solution: `Audit correlation matrices, apply variance inflation factor (VIF) checks, and use robust scaling techniques.`,
        },
      ],
      systemDesignImplications: `Rigorous implementation of ${c1} and ${c2} eliminates data leakage, shrinks inference latencies into single-digit milliseconds, and provides defensible statistical guarantees for production deployment.`,
      reflectionPrompt: `If your production model's input feature distribution experiences a 20% covariate shift next month, what automated monitoring signals will trigger a retrain before business metrics degrade?`,
    };
  }

  // 6. DEFAULT UNIVERSAL EXPERT DISCOURSE (Systems, Cloud, Security, Finance, General)
  return {
    overview: `${params.sessionTitle} constitutes a core structural pillar in mastering ${subject}. This discourse establishes the theoretical foundations, operational invariants, and mechanical interactions required to reason rigorously about ${c1} and ${c2}. Rather than viewing these constructs as isolated procedures, practitioners must understand the deterministic laws governing their lifecycle, resource ownership, and failure domains.`,
    firstPrinciples: `At first principles, ${c1} addresses the fundamental tension between execution velocity, operational safety, and predictable state transitions. In non-trivial architectures, naive state synchronization introduces nondeterminism, cascading bottlenecks, and unbounded failure domains. By establishing strict invariants around ${c1} and ${c2}, the system guarantees deterministic state transitions, formal isolation boundaries, and bounded operational characteristics.`,
    mentalModel: `Think of ${c1} not as a procedural utility, but as an explicit formal contract: every unit of work possesses deterministic ownership, bounded lifecycle, and strict isolation from external side-effects.`,
    sections: [
      {
        heading: `1. Formal Mechanisms & Invariant Guarantees of ${c1}`,
        body: `When analyzing ${c1}, the primary mechanical consideration is how state and control flow are managed under saturated execution pressure. Modern engineering paradigms enforce explicit separation of configuration, execution, and state persistence. Every invocation transition moves through three deterministic phases: initialization and boundary validation, atomic execution within an isolated context, and deterministic teardown or synchronization. This eliminates unpredictable race conditions and protects the primary execution path.`,
        keyTakeaways: [
          `Strict enforcement of single-responsibility and clear lifecycle boundaries prevents silent corruption and resource leaks.`,
          `Decoupling execution from mutation guarantees consistent sub-second dispatch under heavy workloads.`,
        ],
        codeExample: {
          language: "typescript",
          title: `Idiomatic, Resilient Implementation Pattern for ${c1}`,
          code: `// Deterministic execution harness illustrating bounded lifecycle and error containment
interface TaskContext {
  id: string;
  timestamp: number;
}

interface ExecutionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function executeBoundedTask<T>(
  ctx: TaskContext,
  task: (ctx: TaskContext) => Promise<T>,
  timeoutMs = 5000
): Promise<ExecutionResult<T>> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Task " + ctx.id + " exceeded timeout threshold (" + timeoutMs + "ms)")), timeoutMs)
  );

  try {
    const data = await Promise.race([task(ctx), timeoutPromise]);
    return { success: true, data };
  } catch (err: any) {
    // Isolate error without crashing the parent process
    return {
      success: false,
      error: err?.message || "Unhandled execution fault",
    };
  }
}`,
          explanation: `Notice how 'Promise.race' enforces strict timeout bounds to prevent unhandled background routines from pinning resources indefinitely.`,
        },
      },
      {
        heading: `2. Structural Composition and Operational Invariants of ${c2}`,
        body: `As systems scale in complexity or throughput, ${c2} emerges as the governing constraint. In complex environments, naive sequential blocking rapidly degrades throughput into escalating queue depths. By structuring ${c2} with bounded buffers, non-blocking asynchronous dispatch, and backpressure telemetry, downstream consumers remain protected from upstream bursts. This architectural discipline separates burst tolerance from steady-state capacity.`,
        keyTakeaways: [
          `Always establish explicit capacity bounds; unbounded queues inevitably convert transient load spikes into catastrophic crashes.`,
          `Telemetry and health signals must be decoupled from the critical path to prevent observability overhead.`,
        ],
      },
      {
        heading: `3. State Machine Evolution & Failure Domain Isolation (${c3})`,
        body: `Every resilient implementation of ${c3} requires an explicit failure domain. When a transient operational fault, hardware error, or malformed input occurs, the system must shed load or fail fast rather than allowing errors to propagate across component boundaries. Implementing circuit breakers, dead-letter fallbacks, and idempotent retry semantics guarantees that degraded subsystems fail cleanly without poisoning the global state.`,
        keyTakeaways: [
          `Design for failure as a first-class operational state, not an exceptional edge case.`,
          `Idempotency keys and replay buffers ensure that retry storms do not duplicate destructive side effects.`,
        ],
      },
    ],
    pitfalls: [
      {
        antipattern: `Unbounded Ingestion Buffers with Implicit Allocation`,
        consequence: `Under transient downstream slowdowns, memory or backlog consumption grows linearly with incoming traffic, triggering out-of-memory or system exhaustion.`,
        solution: `Apply explicit bounded capacity with backpressure rejection or rate limits when capacity threshold exceeds 80%.`,
      },
      {
        antipattern: `Leaking Lifecycles & Uncanceled Background Routines`,
        consequence: `Routines blocked on unbuffered channels or unresolved promises remain pinned indefinitely, causing silent resource accumulation.`,
        solution: `Always wire cancellation signals with explicit deadlines or timeouts to every asynchronous invocation.`,
      },
    ],
    systemDesignImplications: `Implementing ${c1} and ${c2} with strict mechanical discipline yields predictable scheduling overhead, eliminates resource contention bottlenecks, and maintains tight performance guarantees even under saturation.`,
    reflectionPrompt: `If your environment experiences a sudden 10x workload spike while downstream dependencies slow down, how does your implementation of ${c1} dynamically shed load without dropping in-flight transactional invariants?`,
  };
}
