import { OrganizedTask } from "../lib/types";

const priorityColors: Record<string, string> = {
  High: "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low: "bg-green-100 text-green-700 border-green-200",
};

export default function TaskCard({ task }: { task: OrganizedTask }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold shrink-0">
            {task.order}
          </span>
          <h3 className="font-semibold text-gray-900 text-base leading-tight break-words min-w-0">
            {task.task}
          </h3>
        </div>
        <span
          className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border shrink-0 ${priorityColors[task.priority] || priorityColors.Medium}`}
        >
          {task.priority}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 text-sm mb-2">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md font-medium">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          {task.phase}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {task.timeEstimate}
        </span>
      </div>

      {task.dependencies && (
        <p className="text-sm text-gray-500 mb-1 break-words">
          <span className="font-medium">Depends on:</span> {task.dependencies}
        </p>
      )}

      {task.note && (
        <p className="text-sm text-blue-600 italic mt-2 break-words">
          {task.note}
        </p>
      )}
    </div>
  );
}
