import { z } from "zod";

// Growth intents
export const GrowthIntentSchema = z.enum([
  "Start from zero",
  "Level up in current area",
  "Switch fields",
  "Prepare for a role or exam",
  "Go deeper on a niche",
]);
export type GrowthIntent = z.infer<typeof GrowthIntentSchema>;

// Skill levels
export const SkillLevelSchema = z.enum([
  "Beginner",
  "Some experience",
  "Intermediate",
  "Advanced",
]);
export type SkillLevel = z.infer<typeof SkillLevelSchema>;

// Learning styles
export const LearningStyleSchema = z.enum([
  "Video-first",
  "Hands-on projects",
  "Reading",
  "Mixed",
]);
export type LearningStyle = z.infer<typeof LearningStyleSchema>;

// Intake Input Schema
export const IntakeInputSchema = z.object({
  goal: z.string().min(2, "Goal must be at least 2 characters").max(300),
  speciality: z.string().max(300).optional().default(""),
  growthIntent: GrowthIntentSchema,
  currentLevel: SkillLevelSchema,
  hoursPerWeek: z.coerce.number().min(1).max(60).default(6),
  targetWeeks: z.coerce.number().min(1).max(52).default(8),
  learningStyle: z.array(LearningStyleSchema).min(1).default(["Video-first", "Hands-on projects"]),
  diagnosticResult: z
    .object({
      level: SkillLevelSchema,
      reason: z.string(),
      score: z.number(),
    })
    .optional(),
});
export type IntakeInput = z.infer<typeof IntakeInputSchema>;

// Video duration target
export const VideoDurationRangeSchema = z.enum(["short", "medium", "long"]);
export type VideoDurationRange = z.infer<typeof VideoDurationRangeSchema>;

// Video recommendation
export const VideoRecommendationSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  channel: z.string(),
  duration: z.string(), // "MM:SS" or "HH:MM:SS"
  durationSeconds: z.number().default(0),
  thumbnail: z.string(),
  url: z.string(),
  why: z.string(),
  views: z.number().optional(),
  isFallback: z.boolean().optional(),
  fallbackSearchUrl: z.string().optional(),
});
export type VideoRecommendation = z.infer<typeof VideoRecommendationSchema>;

// Checkpoint Question
export const CheckpointQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["multiple_choice", "practical_task"]).default("multiple_choice"),
  question: z.string(),
  options: z.array(z.string()).default([]),
  correctIndex: z.number().default(0),
  taskCriteria: z.string().optional(),
  explanation: z.string(),
});
export type CheckpointQuestion = z.infer<typeof CheckpointQuestionSchema>;

// Theoretical Discourse Schema
export const DiscourseSectionSchema = z.object({
  heading: z.string(),
  body: z.string(),
  keyTakeaways: z.array(z.string()).default([]),
  codeExample: z
    .object({
      language: z.string(),
      title: z.string(),
      code: z.string(),
      explanation: z.string(),
    })
    .optional(),
});
export type DiscourseSection = z.infer<typeof DiscourseSectionSchema>;

export const CommonPitfallSchema = z.object({
  antipattern: z.string(),
  consequence: z.string(),
  solution: z.string(),
});
export type CommonPitfall = z.infer<typeof CommonPitfallSchema>;

export const TheoreticalDiscourseSchema = z.object({
  overview: z.string(),
  firstPrinciples: z.string(),
  mentalModel: z.string().optional(),
  sections: z.array(DiscourseSectionSchema).default([]),
  pitfalls: z.array(CommonPitfallSchema).default([]),
  systemDesignImplications: z.string().optional(),
  reflectionPrompt: z.string().optional(),
});
export type TheoreticalDiscourse = z.infer<typeof TheoreticalDiscourseSchema>;

// Session
export const SessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  objective: z.string(),
  estimated_minutes: z.coerce.number().min(5).max(720).default(60),
  concepts: z.array(z.string()).default([]),
  search_queries: z.array(z.string()).min(1).max(5),
  target_video_minutes_range: VideoDurationRangeSchema.default("medium"),
  difficulty: SkillLevelSchema.default("Intermediate"),
  video: VideoRecommendationSchema.optional(),
  alternate_video: VideoRecommendationSchema.optional(),
  checkpoints: z.array(CheckpointQuestionSchema).optional(),
  theory: TheoreticalDiscourseSchema.optional(),
});
export type Session = z.infer<typeof SessionSchema>;

// Week
export const WeekSchema = z.object({
  number: z.number(),
  theme: z.string(),
  sessions: z.array(SessionSchema),
});
export type Week = z.infer<typeof WeekSchema>;

// Phase Project Milestone
export const PhaseProjectSchema = z.object({
  title: z.string(),
  brief: z.string(),
  acceptance_criteria: z.array(z.string()).default([]),
  stretch: z.string().default("Extend implementation with automated performance benchmarks."),
});
export type PhaseProject = z.infer<typeof PhaseProjectSchema>;

// Phase
export const PhaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  goal: z.string(),
  project: PhaseProjectSchema,
  weeks: z.array(WeekSchema),
});
export type Phase = z.infer<typeof PhaseSchema>;

// Full Plan Schema (Stage A + Attached Videos)
export const PlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  assumptions: z.array(z.string()),
  intake: IntakeInputSchema,
  phases: z.array(PhaseSchema),
  created_at: z.string(),
  isDemo: z.boolean().optional(),
});
export type Plan = z.infer<typeof PlanSchema>;

// Clarifying Question or Refusal
export const StageAResponseSchema = z.object({
  refusal_reason: z.string().nullable().optional(),
  clarifying_question: z.string().nullable().optional(),
  plan: z
    .object({
      title: z.string(),
      summary: z.string(),
      assumptions: z.array(z.string()),
      phases: z.array(PhaseSchema),
    })
    .nullable()
    .optional(),
});
export type StageAResponse = z.infer<typeof StageAResponseSchema>;

// User progress state (stored per plan in localStorage)
export interface PlanProgress {
  planId: string;
  completedSessionIds: string[];
  sessionFeedback: Record<string, "too_easy" | "too_hard" | "stuck">;
  checkpointAnswers: Record<
    string, // sessionId
    { questionId: string; selectedIndex: number; isCorrect: boolean }[]
  >;
  projectCompletedPhases: string[];
  currentWeekNumber: number;
  streakDays: number;
  startedAt: string;
  lastActiveAt: string;
}

// Adaptive Replanning Patch Schema
export const ReplanPatchSchema = z.object({
  explanation: z.string(),
  modifications: z.array(
    z.object({
      type: z.enum(["modify", "add", "remove"]),
      phaseId: z.string(),
      weekNumber: z.number(),
      sessionId: z.string().optional(),
      session: SessionSchema.optional(),
      changes: z.string(),
    })
  ),
});
export type ReplanPatch = z.infer<typeof ReplanPatchSchema>;

// Diagnostic Test Schema
export const DiagnosticQuestionSchema = z.object({
  id: z.string(),
  levelTarget: SkillLevelSchema,
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().min(0).max(3),
  rationale: z.string(),
});
export type DiagnosticQuestion = z.infer<typeof DiagnosticQuestionSchema>;

export const DiagnosticEvaluationSchema = z.object({
  verdict: SkillLevelSchema,
  reason: z.string(),
  score: z.number(),
});
export type DiagnosticEvaluation = z.infer<typeof DiagnosticEvaluationSchema>;
