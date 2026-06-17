"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectSetupStore } from "@/lib/stores/projectSetupStore";

const MIN_TASKS = 5;
const MAX_TASKS = 10;

// ProjectRoadmapStep — Step 5 of project creation: break the project into 5-10 tasks
export default function ProjectRoadmapStep() {
  const router = useRouter();
  const setup = useProjectSetupStore((state) => state);
  const setTasks = useProjectSetupStore((state) => state.setTasks);

  // tasks — local list of task text inputs, starts with 5 empty slots
  const [tasks, setTasksLocal] = useState<string[]>(["", "", "", "", ""]);

  function handleTaskChange(index: number, value: string) {
    setTasksLocal((current) =>
      current.map((task, i) => (i === index ? value : task))
    );
  }

  function handleAddTask() {
    if (tasks.length < MAX_TASKS) {
      setTasksLocal((current) => [...current, ""]);
    }
  }

  function handleRemoveTask(index: number) {
    setTasksLocal((current) => current.filter((_, i) => i !== index));
  }

  function handleContinue() {
    const filledTasks = tasks
      .map((task) => task.trim())
      .filter((task) => task.length > 0);

    setTasks(filledTasks);
    router.push("/projects/new/review");
  }

  const filledCount = tasks.filter((task) => task.trim().length > 0).length;
  const canContinue = filledCount >= MIN_TASKS;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6 py-12">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-[#F0EDEA]">
            Lay out your roadmap.
          </h2>
          <p className="text-sm text-[#6B6B6B]">
            Break {setup.title} into 5-10 steps. This becomes your task list.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {tasks.map((task, index) => (
            <div
              key={index}
              className="flex items-center gap-2"
            >
              <label
                htmlFor={`task-${index}`}
                className="sr-only"
              >
                Step {index + 1}
              </label>
              <input
                id={`task-${index}`}
                type="text"
                value={task}
                onChange={(e) => handleTaskChange(index, e.target.value)}
                placeholder={`Step ${index + 1}`}
                className="flex-1 px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] placeholder-[#6B6B6B] text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
              />
              {tasks.length > 1 && (
                <button
                  onClick={() => handleRemoveTask(index)}
                  aria-label={`Remove step ${index + 1}`}
                  className="text-[#6B6B6B] hover:text-[#7B2D2D] text-sm px-2 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {tasks.length < MAX_TASKS && (
          <button
            onClick={handleAddTask}
            className="w-full py-3 border border-[#1F1F1F] text-[#6B6B6B] text-sm rounded-md hover:border-[#C9A84C]/50 hover:text-[#F0EDEA] transition-colors"
          >
            + Add a step
          </button>
        )}

        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Continue ({filledCount}/{MIN_TASKS} min)
        </button>

      </div>
    </main>
  );
}
