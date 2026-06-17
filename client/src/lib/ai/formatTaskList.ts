type ProjectTask = {
    title: string;
    completed: boolean;
    completed_at: string | null;
  };
  
  type FormattedTaskList = {
    roadmap: string;
    completedToday: string[];
  };
  
  // formatTaskList — formats the project roadmap for AI prompts, and identifies tasks completed today
  export function formatTaskList(tasks: ProjectTask[]): FormattedTaskList {
    if (tasks.length === 0) {
      return {
        roadmap: "No roadmap steps yet.",
        completedToday: [],
      };
    }
  
    const today = new Date().toISOString().slice(0, 10);
  
    const roadmap = tasks
      .map((task) => `- [${task.completed ? "x" : " "}] ${task.title}`)
      .join("\n");
  
    const completedToday = tasks
      .filter((task) => task.completed_at?.slice(0, 10) === today)
      .map((task) => task.title);
  
    return { roadmap, completedToday };
  }
  