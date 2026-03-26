export interface OrganizedTask {
  order: number;
  task: string;
  phase: string;
  priority: "High" | "Medium" | "Low";
  timeEstimate: string;
  dependencies: string | null;
  note: string | null;
}

export interface Project {
  id: string;
  title: string;
  context: string;
  tasks: string[];
  plan: OrganizedTask[];
  createdAt: number;
}
