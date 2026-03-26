"use client";

import { useState } from "react";
import TaskInput from "./components/TaskInput";
import TaskCard from "./components/TaskCard";
import KanbanView from "./components/KanbanView";

interface OrganizedTask {
  order: number;
  task: string;
  phase: string;
  priority: "High" | "Medium" | "Low";
  timeEstimate: string;
  dependencies: string | null;
  note: string | null;
}

type ViewMode = "list" | "kanban";
type SortMode = "order" | "priority" | "phase" | "time";

const priorityOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

function sortTasks(tasks: OrganizedTask[], sortBy: SortMode): OrganizedTask[] {
  const sorted = [...tasks];
  switch (sortBy) {
    case "priority":
      sorted.sort(
        (a, b) =>
          (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)
      );
      break;
    case "phase":
      sorted.sort((a, b) => a.phase.localeCompare(b.phase));
      break;
    case "time":
      sorted.sort((a, b) => a.timeEstimate.localeCompare(b.timeEstimate));
      break;
    default:
      sorted.sort((a, b) => a.order - b.order);
  }
  return sorted;
}

export default function Home() {
  const [tasks, setTasks] = useState<string[]>([]);
  const [context, setContext] = useState("");
  const [plan, setPlan] = useState<OrganizedTask[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("list");
  const [sortBy, setSortBy] = useState<SortMode>("order");

  const addTask = (task: string) => {
    setTasks((prev) => [...prev, task]);
  };

  const removeTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const bulkAdd = (newTasks: string[]) => {
    setTasks((prev) => [...prev, ...newTasks]);
  };

  const organize = async () => {
    setLoading(true);
    setError(null);
    setPlan(null);

    try {
      const res = await fetch("/api/organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, context }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setPlan(data.plan);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Request failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const sorted = plan ? sortTasks(plan, sortBy) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Task Organizer</h1>
          <p className="text-gray-500 text-sm mt-1">
            Add your tasks and let AI organize them into an optimal plan
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <TaskInput
            tasks={tasks}
            onAddTask={addTask}
            onRemoveTask={removeTask}
            onBulkAdd={bulkAdd}
            context={context}
            onContextChange={setContext}
            onOrganize={organize}
            loading={loading}
          />
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {sorted && sorted.length > 0 && (
          <div className="mt-8">
            {/* Controls */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Your Plan ({sorted.length} tasks)
              </h2>
              <div className="flex items-center gap-3">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortMode)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="order">Sort: Step Order</option>
                  <option value="priority">Sort: Priority</option>
                  <option value="phase">Sort: Phase</option>
                  <option value="time">Sort: Time Estimate</option>
                </select>
                {/* View Toggle */}
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    onClick={() => setView("list")}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      view === "list"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setView("kanban")}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      view === "kanban"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Kanban
                  </button>
                </div>
              </div>
            </div>

            {/* Views */}
            {view === "list" ? (
              <div className="space-y-3">
                {sorted.map((t) => (
                  <TaskCard key={t.order} task={t} />
                ))}
              </div>
            ) : (
              <KanbanView tasks={sorted} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
