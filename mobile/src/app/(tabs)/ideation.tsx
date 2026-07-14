// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth";
import { apiPost } from "@/lib/api";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Project = {
  id: string;
  title: string;
};

type Task = {
  id: string;
  title: string;
  completed: boolean;
};

// ── SCREEN ────────────────────────────────────────────────────────────────────
export default function IdeationScreen() {
  // ── STATE ─────────────────────────────────────────────────────────────────
  const { session } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [addingSuggestions, setAddingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── DATA ──────────────────────────────────────────────────────────────────
  async function load() {
    if (!session?.user) return;

    const { data, error: projectsError } = await supabase
      .from("projects")
      .select("id, title")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .order("deposit_amount", { ascending: false });

    if (projectsError) {
      console.error("ideation: projects fetch failed", projectsError);
    }

    const fetchedProjects = data ?? [];
    setProjects(fetchedProjects);

    const first = fetchedProjects[0] ?? null;
    if (first) {
      setSelectedId(first.id);
      await loadTasks(first.id);
    }

    setLoading(false);
  }

  async function loadTasks(projectId: string) {
    const { data, error: tasksError } = await supabase
      .from("project_tasks")
      .select("id, title, completed")
      .eq("project_id", projectId)
      .order("position", { ascending: true });

    if (tasksError) {
      console.error("ideation: tasks fetch failed", tasksError);
    }

    setTasks(data ?? []);
    setSuggestions([]);
    setSelectedSuggestions(new Set());
    setError(null);
  }

  async function switchProject(projectId: string) {
    setSelectedId(projectId);
    await loadTasks(projectId);
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [session])
  );

  // ── HANDLERS ──────────────────────────────────────────────────────────────
  async function handleAddTask() {
    const title = newTaskTitle.trim();
    if (!title || !selectedId) return;

    setAddingTask(true);
    setError(null);

    const { data, error: addError } = await apiPost<{ task: Task }>(
      `/api/projects/${selectedId}/tasks`,
      { title }
    );

    if (addError || !data) {
      console.error("ideation: add task failed", addError);
      setError(addError ?? "Failed to add task");
    } else {
      setTasks((current) => [...current, data.task]);
      setNewTaskTitle("");
    }

    setAddingTask(false);
  }

  async function handleGenerate() {
    if (!selectedId) return;

    setGenerating(true);
    setError(null);
    setSuggestions([]);
    setSelectedSuggestions(new Set());

    const { data, error: genError } = await apiPost<{ suggestions: string[] }>(
      `/api/projects/${selectedId}/tasks/generate`,
      {}
    );

    if (genError || !data) {
      console.error("ideation: generate failed", genError);
      setError(genError ?? "Failed to generate suggestions");
    } else {
      setSuggestions(data.suggestions ?? []);
    }

    setGenerating(false);
  }

  function toggleSuggestion(index: number) {
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
    if (!selectedId || selectedSuggestions.size === 0) return;

    setAddingSuggestions(true);
    setError(null);

    const titlesToAdd = suggestions.filter((_, i) => selectedSuggestions.has(i));
    const newTasks: Task[] = [];

    for (const title of titlesToAdd) {
      const { data, error: addError } = await apiPost<{ task: Task }>(
        `/api/projects/${selectedId}/tasks`,
        { title }
      );
      if (addError || !data) {
        console.error("ideation: add selected task failed", addError);
        setError(addError ?? "Failed to add task");
      } else {
        newTasks.push(data.task);
      }
    }

    setTasks((current) => [...current, ...newTasks]);
    setSuggestions([]);
    setSelectedSuggestions(new Set());
    setAddingSuggestions(false);
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#0A0A0A] items-center justify-center">
        <ActivityIndicator color="#C9A84C" />
      </SafeAreaView>
    );
  }

  if (projects.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#0A0A0A] items-center justify-center px-6">
        <Text className="text-sm text-[#6B6B6B] text-center">
          No active projects. Start a project first.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="px-6 py-10 gap-8"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#C9A84C"
            />
          }
        >

          <View className="gap-1">
            <Text className="text-2xl font-bold text-[#F0EDEA]">Ideation</Text>
            <Text className="text-sm text-[#6B6B6B]">Build out your roadmap.</Text>
          </View>

          {projects.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2"
            >
              {projects.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => switchProject(p.id)}
                  className={`px-4 py-2 rounded-full border ${
                    p.id === selectedId
                      ? "bg-[#C9A84C] border-[#C9A84C]"
                      : "border-[#1F1F1F]"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      p.id === selectedId ? "text-[#0A0A0A]" : "text-[#6B6B6B]"
                    }`}
                  >
                    {p.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View className="gap-3">
            <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
              Current roadmap
            </Text>
            {tasks.length === 0 ? (
              <Text className="text-sm text-[#6B6B6B]">No roadmap steps yet.</Text>
            ) : (
              <View className="gap-2">
                {tasks.map((task) => (
                  <View
                    key={task.id}
                    className="px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md"
                  >
                    <Text
                      className={`text-sm ${
                        task.completed ? "text-[#6B6B6B] line-through" : "text-[#F0EDEA]"
                      }`}
                    >
                      {task.title}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View className="gap-3">
            <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
              Add your own
            </Text>
            <View className="flex-row gap-2">
              <TextInput
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                placeholder="Add a roadmap step"
                placeholderTextColor="#6B6B6B"
                className="flex-1 px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] text-sm"
              />
              <TouchableOpacity
                onPress={handleAddTask}
                disabled={addingTask || !newTaskTitle.trim()}
                className="px-5 py-3 bg-[#C9A84C] rounded-md items-center justify-center disabled:opacity-40"
              >
                <Text className="text-sm font-semibold text-[#0A0A0A]">
                  {addingTask ? "…" : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="gap-3">
            <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
              Get AI suggestions
            </Text>
            <TouchableOpacity
              onPress={handleGenerate}
              disabled={generating}
              className="py-3 border border-[#1F1F1F] rounded-md items-center disabled:opacity-40"
            >
              <Text className="text-sm text-[#F0EDEA]">
                {generating ? "Thinking…" : "Generate ideas"}
              </Text>
            </TouchableOpacity>

            {suggestions.length > 0 && (
              <View className="gap-3">
                <View className="gap-2">
                  {suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => toggleSuggestion(index)}
                      className="flex-row items-center gap-3 px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md"
                    >
                      <View
                        className={`w-4 h-4 rounded-sm border ${
                          selectedSuggestions.has(index)
                            ? "bg-[#C9A84C] border-[#C9A84C]"
                            : "border-[#6B6B6B]"
                        }`}
                      />
                      <Text className="text-sm text-[#F0EDEA] flex-1">
                        {suggestion}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  onPress={handleAddSelected}
                  disabled={addingSuggestions || selectedSuggestions.size === 0}
                  className="py-3 bg-[#C9A84C] rounded-md items-center disabled:opacity-40"
                >
                  <Text className="text-sm font-semibold text-[#0A0A0A]">
                    {addingSuggestions ? "Adding…" : "Add selected"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {error && (
            <Text className="text-sm text-[#7B2D2D]">{error}</Text>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
