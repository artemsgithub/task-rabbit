"use client";

import { useState } from "react";
import { Project, Folder } from "../lib/types";

const phaseColors = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
];

export default function ProjectCard({
  project,
  folders,
  onClick,
  onDelete,
  onRename,
  onMoveToFolder,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  project: Project;
  folders: Folder[];
  onClick: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
  onMoveToFolder: (folderId: string | undefined) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(project.title);
  const [showMenu, setShowMenu] = useState(false);

  const phases = [...new Set(project.plan.map((t) => t.phase))];
  const highCount = project.plan.filter((t) => t.priority === "High").length;
  const date = new Date(project.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const handleRename = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== project.title) {
      onRename(trimmed);
    }
    setEditing(false);
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={editing ? undefined : onClick}
      className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group relative"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        {editing ? (
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") setEditing(false);
            }}
            onClick={(e) => e.stopPropagation()}
            className="font-semibold text-gray-900 text-base leading-tight w-full border border-blue-300 rounded px-2 py-0.5 outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <h3 className="font-semibold text-gray-900 text-base leading-tight">
            {project.title}
          </h3>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {/* Menu button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm leading-none p-1"
            aria-label="Project options"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dropdown menu */}
      {showMenu && (
        <div
          className="absolute right-4 top-12 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[160px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setShowMenu(false);
              setEditTitle(project.title);
              setEditing(true);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Rename
          </button>
          {(onMoveUp || onMoveDown) && (
            <div className="flex border-t border-gray-100">
              <button
                disabled={!onMoveUp}
                onClick={() => {
                  setShowMenu(false);
                  onMoveUp?.();
                }}
                className="flex-1 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-default flex items-center justify-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
                Up
              </button>
              <button
                disabled={!onMoveDown}
                onClick={() => {
                  setShowMenu(false);
                  onMoveDown?.();
                }}
                className="flex-1 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-default flex items-center justify-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                Down
              </button>
            </div>
          )}
          {folders.length > 0 && (
            <div className="border-t border-gray-100">
              <p className="px-4 py-1.5 text-xs text-gray-400 font-medium">
                Move to folder
              </p>
              {project.folderId && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onMoveToFolder(undefined);
                  }}
                  className="w-full text-left px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  No folder
                </button>
              )}
              {folders
                .filter((f) => f.id !== project.folderId)
                .map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setShowMenu(false);
                      onMoveToFolder(f.id);
                    }}
                    className="w-full text-left px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    {f.name}
                  </button>
                ))}
            </div>
          )}
          <div className="border-t border-gray-100">
            <button
              onClick={() => {
                setShowMenu(false);
                onDelete();
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
      )}

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
