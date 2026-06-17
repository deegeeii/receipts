"use client";

import { useState } from "react";

type Task = {
  id: string;
  title: string;
  completed: boolean;
};

type IdeationWorkspaceProps = {
  projectId: string;
  initialTasks: Task[];
};

// IdeationWorkspace — shows current roadmap, manual "add your own" entry, and AI-generated suggestions
export default function IdeationWorkspace({
  projectId,
  initialTasks,
}: IdeationWorkspaceProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(
    new Set()
  );
  const [generating, setGenerating] = useState(false);
  const [addingSuggestions, setAddingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addTask(title: string) {
    const response = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("ideation: add task failed", data);
      setError(data.error ?? "Failed to add task");
      return null;
    }

    return data.task as Task;
  }

  async function handleAddTask() {
    const title = newTaskTitle.trim();

    if (!title) {
      return;
    }

    setAddingTask(true);
    setError(null);

    const task = await addTask(title);

    if (task) {
      setTasks((current) => [...current, task]);
      setNewTaskTitle("");
    }

    setAddingTask(false);
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setSuggestions([]);
    setSelectedSuggestions(new Set());

    const response = await fetch(
      `/api/projects/${projectId}/tasks/generate`,
      {
        method: "POST",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("ideation: generate tasks failed", data);
      setError(data.error ?? "Failed to generate suggestions");
      setGenerating(false);
      return;
    }

    setSuggestions(data.suggestions ?? []);
    setGenerating(false);
  }

  function handleToggleSuggestion(index: number) {
    setSelectedSuggestions((current) => {
      const next = new Set(current);

      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      return next;
    });
  }

  async function handleAddSelected() {
    setAddingSuggestions(true);
    setError(null);

    const titlesToAdd = suggestions.filter((_, index) =>
      selectedSuggestions.has(index)
    );

    const newTasks: Task[] = [];

    for (const title of titlesToAdd) {
      const task = await addTask(title);

      if (task) {
        newTasks.push(task);
      }
    }

    setTasks((current) => [...current, ...newTasks]);
    setSuggestions([]);
    setSelectedSuggestions(new Set());
    setAddingSuggestions(false);
  }

  return (
    <div className="flex flex-col gap-8">

      <div className="flex flex-col gap-3">
        <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
          Current roadmap
        </span>

        {tasks.length === 0 ? (
          <p className="text-sm text-[#6B6B6B]">
            No roadmap steps yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md"
              >
                <span
                  className={`text-sm ${
                    task.completed
                      ? "text-[#6B6B6B] line-through"
                      : "text-[#F0EDEA]"
                  }`}
                >
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
          Add your own
        </span>

        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a roadmap step"
            className="flex-1 px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] placeholder-[#6B6B6B] text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
          />
          <button
            onClick={handleAddTask}
            disabled={addingTask || !newTaskTitle.trim()}
            className="px-5 py-3 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-sm rounded-md hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
          Get AI suggestions
        </span>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-3 border border-[#1F1F1F] text-[#F0EDEA] text-sm rounded-md hover:border-[#C9A84C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {generating ? "Thinking..." : "Generate ideas"}
        </button>

        {suggestions.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              {suggestions.map((suggestion, index) => (
                <label
                  key={index}
                  htmlFor={`suggestion-${index}`}
                  className="flex items-center gap-3 px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md cursor-pointer"
                >
                  <input
                    id={`suggestion-${index}`}
                    type="checkbox"
                    checked={selectedSuggestions.has(index)}
                    onChange={() => handleToggleSuggestion(index)}
                    className="accent-[#C9A84C]"
                  />
                  <span className="text-sm text-[#F0EDEA]">
                    {suggestion}
                  </span>
                </label>
              ))}
            </div>

            <button
              onClick={handleAddSelected}
              disabled={addingSuggestions || selectedSuggestions.size === 0}
              className="w-full py-3 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-sm rounded-md hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Add selected
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-[#7B2D2D]">{error}</p>
      )}

    </div>
  );
}
