"use client";

import { useState } from "react";

interface TaskInputProps {
  tasks: string[];
  onAddTask: (task: string) => void;
  onRemoveTask: (index: number) => void;
  onBulkAdd: (tasks: string[]) => void;
  context: string;
  onContextChange: (context: string) => void;
  onOrganize: () => void;
  loading: boolean;
}

export default function TaskInput({
  tasks,
  onAddTask,
  onRemoveTask,
  onBulkAdd,
  context,
  onContextChange,
  onOrganize,
  loading,
}: TaskInputProps) {
  const [singleTask, setSingleTask] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [inputMode, setInputMode] = useState<"single" | "bulk">("single");

  const handleAddSingle = () => {
    const trimmed = singleTask.trim();
    if (trimmed) {
      onAddTask(trimmed);
      setSingleTask("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSingle();
    }
  };

  const handleBulkAdd = () => {
    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length > 0) {
      onBulkAdd(lines);
      setBulkText("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Context */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project Context
        </label>
        <input
          type="text"
          value={context}
          onChange={(e) => onContextChange(e.target.value)}
          placeholder='e.g. "bathroom renovation", "product launch"'
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
        />
      </div>

      {/* Input Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setInputMode("single")}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            inputMode === "single"
              ? "bg-blue-100 text-blue-700 font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Add one at a time
        </button>
        <button
          onClick={() => setInputMode("bulk")}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            inputMode === "bulk"
              ? "bg-blue-100 text-blue-700 font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Paste a list
        </button>
      </div>

      {/* Single Task Input */}
      {inputMode === "single" && (
        <div className="flex gap-2">
          <input
            type="text"
            value={singleTask}
            onChange={(e) => setSingleTask(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter a task..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
          />
          <button
            onClick={handleAddSingle}
            disabled={!singleTask.trim()}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Add
          </button>
        </div>
      )}

      {/* Bulk Input */}
      {inputMode === "bulk" && (
        <div className="space-y-2">
          <button
            onClick={handleBulkAdd}
            disabled={!bulkText.trim()}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Add All
          </button>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="Paste tasks here, one per line..."
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y text-gray-900 placeholder-gray-400"
          />
        </div>
      )}

      {/* Task List */}
      {tasks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Tasks ({tasks.length})
          </h3>
          <ul className="space-y-1.5">
            {tasks.map((task, i) => (
              <li
                key={i}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-200"
              >
                <span className="text-gray-800 text-sm">{task}</span>
                <button
                  onClick={() => onRemoveTask(i)}
                  className="ml-2 text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
                  aria-label={`Remove "${task}"`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Organize Button */}
      <button
        onClick={onOrganize}
        disabled={tasks.length === 0 || loading}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold text-base flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Organizing...
          </>
        ) : (
          "Organize Tasks"
        )}
      </button>
    </div>
  );
}
