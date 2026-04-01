import { OrganizedTask } from "../lib/types";

const priorityColors: Record<string, string> = {
  High: "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low: "bg-green-100 text-green-700 border-green-200",
};

type Priority = "High" | "Medium" | "Low";

const priorities: Priority[] = ["High", "Medium", "Low"];

export default function TaskCard({
  task,
  done = false,
  onToggleDone,
  onPriorityChange,
}: {
  task: OrganizedTask;
  done?: boolean;
  onToggleDone?: (order: number) => void;
  onPriorityChange?: (taskName: string, priority: Priority) => void;
}) {
  return (
    <div
      className={`relative rounded-xl p-5 shadow-sm transition-all overflow-hidden ${
        done
          ? "bg-gray-50 border border-gray-200 opacity-60"
          : "bg-white border border-gray-200 hover:shadow-md"
      }`}
    >
      {/* Crosshatch overlay */}
      {done && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id={`cross-${task.order}`}
              width="12"
              height="12"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="12"
                stroke="#9ca3af"
                strokeWidth="0.5"
                opacity="0.35"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#cross-${task.order})`} />
        </svg>
      )}

      <div className="relative">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Checkbox */}
            <button
              onClick={() => onToggleDone?.(task.order)}
              className={`flex items-center justify-center w-5 h-5 rounded border-2 shrink-0 transition-colors ${
                done
                  ? "bg-green-500 border-green-500 text-white"
                  : "border-gray-300 hover:border-blue-400"
              }`}
              aria-label={done ? "Mark as not done" : "Mark as done"}
            >
              {done && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${
                done
                  ? "bg-gray-400 text-white"
                  : "bg-blue-600 text-white"
              }`}
            >
              {task.order}
            </span>
            <h3
              className={`font-semibold text-base leading-tight break-words min-w-0 ${
                done ? "text-gray-400" : "text-gray-900"
              }`}
            >
              {task.task}
            </h3>
          </div>
          {onPriorityChange && !done ? (
            <select
              value={task.priority}
              onChange={(e) =>
                onPriorityChange(task.task, e.target.value as Priority)
              }
              className={`text-xs font-semibold rounded-full border shrink-0 px-2 py-0.5 outline-none cursor-pointer appearance-none text-center ${
                priorityColors[task.priority] || priorityColors.Medium
              }`}
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          ) : (
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border shrink-0 ${
                done
                  ? "bg-gray-100 text-gray-400 border-gray-200"
                  : priorityColors[task.priority] || priorityColors.Medium
              }`}
            >
              {task.priority}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-sm mb-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-medium ${
              done
                ? "bg-gray-100 text-gray-400"
                : "bg-indigo-50 text-indigo-700"
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            {task.phase}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md ${
              done ? "bg-gray-100 text-gray-400" : "bg-gray-100 text-gray-600"
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {task.timeEstimate}
          </span>
        </div>

        {task.dependencies && (
          <p
            className={`text-sm mb-1 break-words ${
              done ? "text-gray-300" : "text-gray-500"
            }`}
          >
            <span className="font-medium">Depends on:</span>{" "}
            {task.dependencies}
          </p>
        )}

        {task.note && (
          <p
            className={`text-sm italic mt-2 break-words ${
              done ? "text-gray-300" : "text-blue-600"
            }`}
          >
            {task.note}
          </p>
        )}
      </div>
    </div>
  );
}
