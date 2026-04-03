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
  completedTasks?: string[];
  completedSteps?: number[];
  priorityOverrides?: Record<string, "High" | "Medium" | "Low">;
  plan: OrganizedTask[];
  folderId?: string;
  sortOrder?: number;
  createdAt: number;
}

export interface Folder {
  id: string;
  name: string;
  sortOrder: number;
}
