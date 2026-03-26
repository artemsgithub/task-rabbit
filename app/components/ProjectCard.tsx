import { Project } from "../lib/types";

const phaseColors = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
];

export default function ProjectCard({
  project,
  onClick,
  onDelete,
}: {
  project: Project;
  onClick: () => void;
  onDelete: () => void;
}) {
  const phases = [...new Set(project.plan.map((t) => t.phase))];
  const highCount = project.plan.filter((t) => t.priority === "High").length;
  const date = new Date(project.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-gray-900 text-base leading-tight">
          {project.title}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 text-lg leading-none shrink-0"
          aria-label={`Delete "${project.title}"`}
        >
          ×
        </button>
      </div>

      {project.context && project.context !== project.title && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-1">
          {project.context}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {phases.map((phase, i) => (
          <span
            key={phase}
            className="inline-flex items-center gap-1 text-xs text-gray-600"
          >
            <span
              className={`w-2 h-2 rounded-full ${phaseColors[i % phaseColors.length]}`}
            />
            {phase}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          {project.plan.length} tasks
          {highCount > 0 && (
            <span className="text-red-400 ml-1.5">
              {highCount} high priority
            </span>
          )}
        </span>
        <span>{date}</span>
      </div>
    </div>
  );
}
