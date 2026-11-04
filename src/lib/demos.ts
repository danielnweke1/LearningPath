import demo1 from "../../data/demos/demo-1.json";
import demo2 from "../../data/demos/demo-2.json";
import demo3 from "../../data/demos/demo-3.json";
import { Plan } from "@/types/plan";

export interface DemoItem {
  id: string;
  topic: string;
  level: string;
  weeks: number;
  hoursPerWeek: number;
  plan: Plan;
}

export const DEMO_PLANS: DemoItem[] = [
  {
    id: "demo_cloud_sec",
    topic: "Become a cloud security engineer",
    level: "Intermediate",
    weeks: 12,
    hoursPerWeek: 6,
    plan: demo1 as Plan,
  },
  {
    id: "demo_python_data",
    topic: "Learn Python for data analysis",
    level: "Beginner",
    weeks: 8,
    hoursPerWeek: 5,
    plan: demo2 as Plan,
  },
  {
    id: "demo_ai_eng",
    topic: "Move from software developer to AI engineer",
    level: "Intermediate",
    weeks: 10,
    hoursPerWeek: 8,
    plan: demo3 as Plan,
  },
];

export function getDemoPlanById(id: string): Plan | null {
  const match = DEMO_PLANS.find((d) => d.id === id || d.plan.id === id);
  return match ? match.plan : null;
}
