import { Plan, PlanProgress, PlanSchema } from "@/types/plan";

export interface PlanStorageInterface {
  savePlan(plan: Plan): Promise<void>;
  getPlan(id: string): Promise<Plan | null>;
  listPlans(): Promise<Plan[]>;
  deletePlan(id: string): Promise<void>;
  getProgress(planId: string): Promise<PlanProgress>;
  saveProgress(progress: PlanProgress): Promise<void>;
  exportPlanAsJSON(planId: string): Promise<string>;
  importPlanFromJSON(jsonString: string): Promise<Plan>;
}

const STORAGE_KEY_PLANS_PREFIX = "learningpath_plan_";
const STORAGE_KEY_PROGRESS_PREFIX = "learningpath_progress_";
const STORAGE_KEY_ACTIVE_PLAN_ID = "learningpath_active_plan_id";
const STORAGE_KEY_PLAN_INDEX = "learningpath_plans_index";

class LocalStoragePlanStorage implements PlanStorageInterface {
  private isBrowser(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  }

  private getPlanIndex(): string[] {
    if (!this.isBrowser()) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PLAN_INDEX);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private updatePlanIndex(id: string, remove = false): void {
    if (!this.isBrowser()) return;
    try {
      const index = this.getPlanIndex();
      const next = remove ? index.filter((item) => item !== id) : Array.from(new Set([id, ...index]));
      localStorage.setItem(STORAGE_KEY_PLAN_INDEX, JSON.stringify(next));
    } catch (e) {
      console.error("Failed to update plan index:", e);
    }
  }

  async savePlan(plan: Plan): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEY_PLANS_PREFIX + plan.id, JSON.stringify(plan));
      localStorage.setItem(STORAGE_KEY_ACTIVE_PLAN_ID, plan.id);
      this.updatePlanIndex(plan.id);
    } catch (e) {
      console.error("Failed to save plan to localStorage:", e);
      throw new Error("Could not save plan locally. Storage may be full.");
    }
  }

  async getPlan(id: string): Promise<Plan | null> {
    if (!this.isBrowser()) return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PLANS_PREFIX + id);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return PlanSchema.parse(parsed);
    } catch (e) {
      console.error(`Failed to read plan ${id}:`, e);
      return null;
    }
  }

  async listPlans(): Promise<Plan[]> {
    if (!this.isBrowser()) return [];
    const index = this.getPlanIndex();
    const plans: Plan[] = [];
    for (const id of index) {
      const p = await this.getPlan(id);
      if (p) plans.push(p);
    }
    return plans;
  }

  async deletePlan(id: string): Promise<void> {
    if (!this.isBrowser()) return;
    localStorage.removeItem(STORAGE_KEY_PLANS_PREFIX + id);
    localStorage.removeItem(STORAGE_KEY_PROGRESS_PREFIX + id);
    this.updatePlanIndex(id, true);
    if (localStorage.getItem(STORAGE_KEY_ACTIVE_PLAN_ID) === id) {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_PLAN_ID);
    }
  }

  async getProgress(planId: string): Promise<PlanProgress> {
    const defaultProgress: PlanProgress = {
      planId,
      completedSessionIds: [],
      sessionFeedback: {},
      checkpointAnswers: {},
      projectCompletedPhases: [],
      currentWeekNumber: 1,
      streakDays: 1,
      startedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    if (!this.isBrowser()) return defaultProgress;

    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROGRESS_PREFIX + planId);
      if (!raw) return defaultProgress;
      const parsed = JSON.parse(raw);
      return {
        ...defaultProgress,
        ...parsed,
      };
    } catch (e) {
      console.error(`Failed to read progress for ${planId}:`, e);
      return defaultProgress;
    }
  }

  async saveProgress(progress: PlanProgress): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      progress.lastActiveAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY_PROGRESS_PREFIX + progress.planId, JSON.stringify(progress));
    } catch (e) {
      console.error("Failed to save progress:", e);
    }
  }

  async exportPlanAsJSON(planId: string): Promise<string> {
    const plan = await this.getPlan(planId);
    if (!plan) throw new Error("Plan not found");
    const progress = await this.getProgress(planId);
    return JSON.stringify({ plan, progress, exportedAt: new Date().toISOString() }, null, 2);
  }

  async importPlanFromJSON(jsonString: string): Promise<Plan> {
    const data = JSON.parse(jsonString);
    const planCandidate = data.plan || data;
    const validatedPlan = PlanSchema.parse(planCandidate);
    await this.savePlan(validatedPlan);

    if (data.progress) {
      await this.saveProgress({
        ...data.progress,
        planId: validatedPlan.id,
      });
    }

    return validatedPlan;
  }

  getActivePlanId(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(STORAGE_KEY_ACTIVE_PLAN_ID);
  }

  setActivePlanId(id: string): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEY_ACTIVE_PLAN_ID, id);
  }
}

export const planStorage: LocalStoragePlanStorage = new LocalStoragePlanStorage();
