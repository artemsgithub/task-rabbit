"use client";

import { useState, useEffect } from "react";
import TaskInput from "./components/TaskInput";
import TaskCard from "./components/TaskCard";
import KanbanView from "./components/KanbanView";
import ProjectCard from "./components/ProjectCard";
import { OrganizedTask, Project, Folder } from "./lib/types";
import {
  loadProjects,
  saveProject,
  saveProjects,
  deleteProject,
  generateId,
  loadFolders,
  saveFolders,
  createFolder,
  renameFolder,
  deleteFolder,
} from "./lib/storage";

type ViewMode = "list" | "kanban";
type SortMode = "order" | "priority" | "phase" | "time";
type AppView = "dashboard" | "new" | "project";

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [appView, setAppView] = useState<AppView>("dashboard");
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [dragProjectId, setDragProjectId] = useState<string | null>(null);

  // New project form state
  const [tasks, setTasks] = useState<string[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result view state
  const [view, setView] = useState<ViewMode>("list");
  const [sortBy, setSortBy] = useState<SortMode>("order");
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [priorityOverrides, setPriorityOverrides] = useState<
    Record<string, "High" | "Medium" | "Low">
  >({});

  useEffect(() => {
    setProjects(loadProjects());
    setFolders(loadFolders());
  }, []);

  const resetForm = () => {
    setTasks([]);
    setCompletedTasks(new Set());
    setCompletedSteps(new Set());
    setPriorityOverrides({});
    setContext("");
    setError(null);
  };

  const toggleStep = (order: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(order)) {
        next.delete(order);
      } else {
        next.add(order);
      }
      return next;
    });
  };

  const handlePriorityChange = (
    taskName: string,
    priority: "High" | "Medium" | "Low"
  ) => {
    setPriorityOverrides((prev) => ({ ...prev, [taskName]: priority }));
    // Also update the active project's plan in-place
    if (activeProject) {
      const updatedPlan = activeProject.plan.map((t) =>
        t.task === taskName ? { ...t, priority } : t
      );
      const updated = { ...activeProject, plan: updatedPlan, priorityOverrides: { ...priorityOverrides, [taskName]: priority } };
      setActiveProject(updated);
      saveProject(updated);
      setProjects(loadProjects());
    }
  };

  const toggleComplete = (task: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(task)) {
        next.delete(task);
      } else {
        next.add(task);
      }
      return next;
    });
  };

  const startNewProject = () => {
    resetForm();
    setActiveProject(null);
    setAppView("new");
  };

  const openProject = (project: Project) => {
    setActiveProject(project);
    setTasks(project.tasks);
    setCompletedTasks(new Set(project.completedTasks || []));
    setCompletedSteps(new Set(project.completedSteps || []));
    setPriorityOverrides(project.priorityOverrides || {});
    setContext(project.context);
    setError(null);
    setView("list");
    setSortBy("order");
    setAppView("project");
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
    setProjects(loadProjects());
    if (activeProject?.id === id) {
      setActiveProject(null);
      setAppView("dashboard");
    }
  };

  const handleRenameProject = (id: string, newTitle: string) => {
    const all = loadProjects();
    const p = all.find((x) => x.id === id);
    if (p) {
      p.title = newTitle;
      saveProjects(all);
      setProjects(loadProjects());
    }
  };

  const handleMoveToFolder = (projectId: string, folderId: string | undefined) => {
    const all = loadProjects();
    const p = all.find((x) => x.id === projectId);
    if (p) {
      p.folderId = folderId;
      saveProjects(all);
      setProjects(loadProjects());
    }
  };

  const handleCreateFolder = () => {
    const name = prompt("Folder name:");
    if (name?.trim()) {
      createFolder(name.trim());
      setFolders(loadFolders());
    }
  };

  const handleRenameFolder = (id: string) => {
    const folder = folders.find((f) => f.id === id);
    const name = prompt("Rename folder:", folder?.name);
    if (name?.trim()) {
      renameFolder(id, name.trim());
      setFolders(loadFolders());
    }
  };

  const handleDeleteFolder = (id: string) => {
    deleteFolder(id);
    setFolders(loadFolders());
    setProjects(loadProjects());
  };

  const handleDragStart = (projectId: string, e: React.DragEvent) => {
    setDragProjectId(projectId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverProject = (targetId: string, e: React.DragEvent) => {
    e.preventDefault();
    if (!dragProjectId || dragProjectId === targetId) return;
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnProject = (targetId: string) => {
    if (!dragProjectId || dragProjectId === targetId) return;
    const all = loadProjects();
    const dragIdx = all.findIndex((p) => p.id === dragProjectId);
    const targetIdx = all.findIndex((p) => p.id === targetId);
    if (dragIdx < 0 || targetIdx < 0) return;
    // Also match folder of target
    all[dragIdx].folderId = all[targetIdx].folderId;
    const [moved] = all.splice(dragIdx, 1);
    all.splice(targetIdx, 0, moved);
    saveProjects(all);
    setProjects(loadProjects());
    setDragProjectId(null);
  };

  const handleDropOnFolder = (folderId: string | undefined, e: React.DragEvent) => {
    e.preventDefault();
    if (!dragProjectId) return;
    const all = loadProjects();
    const p = all.find((x) => x.id === dragProjectId);
    if (p) {
      p.folderId = folderId;
      saveProjects(all);
      setProjects(loadProjects());
    }
    setDragProjectId(null);
  };

  const goHome = () => {
    setAppView("dashboard");
    setActiveProject(null);
    resetForm();
  };

  const handleSave = () => {
    if (tasks.length === 0) return;

    const updated: Project = {
      id: activeProject?.id || generateId(),
      title: activeProject?.title || context || "Untitled Project",
      context,
      tasks,
      completedTasks: [...completedTasks],
      completedSteps: [...completedSteps],
      priorityOverrides,
      plan: activeProject?.plan || [],
      createdAt: activeProject?.createdAt || Date.now(),
    };

    saveProject(updated);
    setProjects(loadProjects());
    setActiveProject(updated);
    if (appView === "new") setAppView("project");
  };

  const organize = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks,
          context,
          priorityOverrides:
            Object.keys(priorityOverrides).length > 0
              ? priorityOverrides
              : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      // Merge user priority overrides into the new plan
      const mergedPlan = data.plan.map(
        (t: OrganizedTask) =>
          priorityOverrides[t.task]
            ? { ...t, priority: priorityOverrides[t.task] }
            : t
      );

      const updated: Project = {
        id: activeProject?.id || generateId(),
        title: data.title || context || "Untitled Project",
        context,
        tasks,
        completedTasks: [...completedTasks],
        completedSteps: [...completedSteps],
        priorityOverrides,
        plan: mergedPlan,
        createdAt: activeProject?.createdAt || Date.now(),
      };

      saveProject(updated);
      setProjects(loadProjects());
      setActiveProject(updated);
      setAppView("project");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Request failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const sorted = activeProject
    ? sortTasks(activeProject.plan, sortBy)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div
            onClick={goHome}
            className="cursor-pointer flex items-center gap-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Hoplist logo" className="w-10 h-10" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-serif">Hoplist</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                hop through your list
              </p>
            </div>
          </div>
          {appView !== "new" && (
            <button
              onClick={startNewProject}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Dashboard ── */}
        {appView === "dashboard" && (
          <div>
            {projects.length === 0 && folders.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  No hoplists yet
                </h2>
                <p className="text-gray-500 mb-6 text-sm">
                  Create your first hoplist to get an AI-organized task plan
                </p>
                <button
                  onClick={startNewProject}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Project
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Your Projects ({projects.length})
                  </h2>
                  <button
                    onClick={handleCreateFolder}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    New Folder
                  </button>
                </div>

                {/* Folders */}
                {folders
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((folder) => {
                    const folderProjects = projects.filter(
                      (p) => p.folderId === folder.id
                    );
                    return (
                      <div
                        key={folder.id}
                        className="mb-6"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={(e) => handleDropOnFolder(folder.id, e)}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          <h3 className="text-sm font-semibold text-gray-700">
                            {folder.name}
                          </h3>
                          <span className="text-xs text-gray-400">
                            {folderProjects.length}
                          </span>
                          <button
                            onClick={() => handleRenameFolder(folder.id)}
                            className="text-gray-300 hover:text-gray-500 transition-colors ml-1"
                            aria-label="Rename folder"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteFolder(folder.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                            aria-label="Delete folder"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        {folderProjects.length > 0 ? (
                          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {folderProjects.map((project) => (
                              <ProjectCard
                                key={project.id}
                                project={project}
                                folders={folders}
                                onClick={() => openProject(project)}
                                onDelete={() => handleDelete(project.id)}
                                onRename={(t) => handleRenameProject(project.id, t)}
                                onMoveToFolder={(fId) => handleMoveToFolder(project.id, fId)}
                                onDragStart={(e) => handleDragStart(project.id, e)}
                                onDragOver={(e) => handleDragOverProject(project.id, e)}
                                onDrop={() => handleDropOnProject(project.id)}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400">
                            Drag projects here
                          </div>
                        )}
                      </div>
                    );
                  })}

                {/* Unfiled projects */}
                {(() => {
                  const unfiled = projects.filter(
                    (p) => !p.folderId || !folders.some((f) => f.id === p.folderId)
                  );
                  if (unfiled.length === 0) return null;
                  return (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => handleDropOnFolder(undefined, e)}
                    >
                      {folders.length > 0 && (
                        <h3 className="text-sm font-semibold text-gray-500 mb-3">
                          Unfiled
                        </h3>
                      )}
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {unfiled.map((project) => (
                          <ProjectCard
                            key={project.id}
                            project={project}
                            folders={folders}
                            onClick={() => openProject(project)}
                            onDelete={() => handleDelete(project.id)}
                            onRename={(t) => handleRenameProject(project.id, t)}
                            onMoveToFolder={(fId) => handleMoveToFolder(project.id, fId)}
                            onDragStart={(e) => handleDragStart(project.id, e)}
                            onDragOver={(e) => handleDragOverProject(project.id, e)}
                            onDrop={() => handleDropOnProject(project.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── New Project ── */}
        {appView === "new" && (
          <div className="max-w-2xl mx-auto">
            <button
              onClick={goHome}
              className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to projects
            </button>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">
                New Project
              </h2>
              <TaskInput
                tasks={tasks}
                completedTasks={completedTasks}
                onAddTask={(t) => setTasks((prev) => [...prev, t])}
                onRemoveTask={(i) =>
                  setTasks((prev) => prev.filter((_, idx) => idx !== i))
                }
                onToggleComplete={toggleComplete}
                onBulkAdd={(t) => setTasks((prev) => [...prev, ...t])}
                context={context}
                onContextChange={setContext}
                onOrganize={organize}
                onSave={handleSave}
                loading={loading}
              />
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        {/* ── View Project ── */}
        {appView === "project" && activeProject && (
          <div>
            <button
              onClick={goHome}
              className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to projects
            </button>

            <div className="flex flex-col md:flex-row gap-8">
              {/* Left panel — Editable task list */}
              <div className="md:w-[380px] md:shrink-0">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm md:sticky md:top-8">
                  <TaskInput
                    tasks={tasks}
                    completedTasks={completedTasks}
                    onAddTask={(t) => setTasks((prev) => [t, ...prev])}
                    onRemoveTask={(i) =>
                      setTasks((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    onToggleComplete={toggleComplete}
                    onBulkAdd={(t) => setTasks((prev) => [...t, ...prev])}
                    context={context}
                    onContextChange={setContext}
                    onOrganize={organize}
                    onSave={handleSave}
                    loading={loading}
                  />
                </div>
                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    {error}
                  </div>
                )}
              </div>

              {/* Right panel — Results */}
              <div className="flex-1 min-w-0">
                {sorted && sorted.length > 0 ? (
                  <>
                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {activeProject.title}
                        </h2>
                        <p className="text-sm text-gray-400 mt-0.5">
                          {sorted.length} tasks
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
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
                        {[
                          ...sorted.filter((t) => !completedSteps.has(t.order)),
                          ...sorted.filter((t) => completedSteps.has(t.order)),
                        ].map((t) => (
                          <TaskCard
                            key={t.order}
                            task={t}
                            done={completedSteps.has(t.order)}
                            onToggleDone={toggleStep}
                            onPriorityChange={handlePriorityChange}
                          />
                        ))}
                      </div>
                    ) : (
                      <KanbanView
                        tasks={sorted}
                        completedSteps={completedSteps}
                        onToggleDone={toggleStep}
                        onPriorityChange={handlePriorityChange}
                      />
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                    <div className="text-center">
                      <p className="mb-1">No organized plan yet</p>
                      <p>Add tasks and click &quot;Organize Tasks&quot; to generate a plan</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
