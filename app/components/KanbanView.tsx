import { OrganizedTask } from "../lib/types";
import TaskCard from "./TaskCard";

const phaseColors: Record<number, string> = {
  0: "bg-blue-500",
  1: "bg-purple-500",
  2: "bg-emerald-500",
  3: "bg-amber-500",
  4: "bg-rose-500",
};

export default function KanbanView({ tasks }: { tasks: OrganizedTask[] }) {
  const phases: Record<string, OrganizedTask[]> = {};
  for (const task of tasks) {
    if (!phases[task.phase]) phases[task.phase] = [];
    phases[task.phase].push(task);
  }

  const phaseNames = Object.keys(phases);

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 overflow-hidden">
      {phaseNames.map((phase, idx) => (
        <div
          key={phase}
          className="bg-gray-100 rounded-xl border border-gray-200 min-w-0"
        >
          <div className="p-3 border-b border-gray-200 flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full shrink-0 ${phaseColors[idx % 5]}`}
            />
            <h3 className="font-semibold text-gray-800 text-sm truncate">
              {phase}
            </h3>
            <span className="ml-auto text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full shrink-0">
              {phases[phase].length}
            </span>
          </div>

          <div className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
            {phases[phase]
              .sort((a, b) => a.order - b.order)
              .map((task) => (
                <TaskCard key={task.order} task={task} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
