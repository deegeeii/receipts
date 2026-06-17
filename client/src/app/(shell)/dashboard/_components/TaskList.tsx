"use client";

import { useState } from "react";

type Task = {
  id: string;
  title: string;
  completed: boolean;
};

type TaskListProps = {
  tasks: Task[];
  locked?: boolean;
};

// TaskList — project roadmap checklist, toggles completion via PATCH /api/tasks/[taskId]; read-only once today's check-in is logged
export default function TaskList({ tasks, locked = false }: TaskListProps) {
  const [taskState, setTaskState] = useState<Task[]>(tasks);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(taskId: string, completed: boolean) {
    if (locked) {
      return;
    }

    setTaskState((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, completed } : task
      )
    );

    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });

    if (!response.ok) {
      const data = await response.json();
      console.error("task toggle failed", data);
      setError(data.error ?? "Failed to update task");

      setTaskState((current) =>
        current.map((task) =>
          task.id === taskId ? { ...task, completed: !completed } : task
        )
      );
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
          Roadmap
        </span>

        {locked && (
          <span className="text-xs text-[#6B6B6B]">
            Locked until tomorrow
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {taskState.map((task) => (
          <label
            key={task.id}
            htmlFor={`task-${task.id}`}
            className={`flex items-center gap-3 px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md ${
              locked ? "cursor-not-allowed opacity-60" : "cursor-pointer"
            }`}
          >
            <input
              id={`task-${task.id}`}
              type="checkbox"
              checked={task.completed}
              disabled={locked}
              onChange={(e) => handleToggle(task.id, e.target.checked)}
              className="accent-[#C9A84C]"
            />
            <span
              className={`text-sm ${
                task.completed
                  ? "text-[#6B6B6B] line-through"
                  : "text-[#F0EDEA]"
              }`}
            >
              {task.title}
            </span>
          </label>
        ))}
      </div>

      {error && (
        <p className="text-sm text-[#7B2D2D]">{error}</p>
      )}
    </div>
  );
}
