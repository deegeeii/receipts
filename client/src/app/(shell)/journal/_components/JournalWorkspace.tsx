"use client";

import { useState } from "react";

type Project = {
  id: string;
  title: string;
};

type JournalEntry = {
  id: string;
  project_id: string;
  entry_text: string;
  ai_response: string | null;
  created_at: string;
};

type JournalWorkspaceProps = {
  projects: Project[];
  entriesByProject: Record<string, JournalEntry[]>;
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// JournalWorkspace — project selector, entry form, AI reinforcement, and entry history
export default function JournalWorkspace({
  projects,
  entriesByProject,
}: JournalWorkspaceProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0].id);
  const [entries, setEntries] = useState(entriesByProject);
  const [entryText, setEntryText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedEntries = entries[selectedProjectId] ?? [];

  async function handleSubmit() {
    const trimmed = entryText.trim();

    if (!trimmed) {
      return;
    }

    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: selectedProjectId,
        entry_text: trimmed,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("journal: submit failed", data);
      setError(data.error ?? "Failed to submit journal entry");
      setSubmitting(false);
      return;
    }

    setEntries((current) => ({
      ...current,
      [selectedProjectId]: [data.entry, ...(current[selectedProjectId] ?? [])],
    }));

    setEntryText("");
    setSubmitting(false);
  }

  return (
    <div className="flex flex-col gap-8">

      <div className="flex flex-wrap gap-2">
        {projects.map((project) => {
          const isSelected = project.id === selectedProjectId;

          return (
            <button
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              className={`px-4 py-2 rounded-md text-sm font-semibold border border-[#1F1F1F] transition-colors ${
                isSelected
                  ? "bg-[#111111] text-[#F0EDEA]"
                  : "text-[#6B6B6B] hover:text-[#F0EDEA]"
              }`}
            >
              {project.title}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        <textarea
          value={entryText}
          onChange={(e) => setEntryText(e.target.value)}
          placeholder="What happened this week?"
          rows={5}
          className="w-full px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] placeholder-[#6B6B6B] text-sm focus:outline-none focus:border-[#C9A84C] transition-colors resize-none"
        />

        <button
          onClick={handleSubmit}
          disabled={submitting || !entryText.trim()}
          className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Thinking..." : "Submit entry"}
        </button>

        {error && (
          <p className="text-sm text-[#7B2D2D]">{error}</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
          History
        </span>

        {selectedEntries.length === 0 ? (
          <p className="text-sm text-[#6B6B6B]">
            No entries yet for this project.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {selectedEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-2 px-5 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md"
              >
                <span className="text-xs text-[#6B6B6B]">
                  {formatDate(entry.created_at)}
                </span>

                <p className="text-sm text-[#F0EDEA]">
                  {entry.entry_text}
                </p>

                {entry.ai_response && (
                  <p className="text-sm text-[#C9A84C]">
                    {entry.ai_response}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
