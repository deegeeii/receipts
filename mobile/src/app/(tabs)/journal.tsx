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

type JournalEntry = {
  id: string;
  project_id: string;
  entry_text: string;
  ai_response: string | null;
  created_at: string;
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── SCREEN ────────────────────────────────────────────────────────────────────
export default function JournalScreen() {
  // ── STATE ─────────────────────────────────────────────────────────────────
  const { session } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [entriesByProject, setEntriesByProject] = useState<Record<string, JournalEntry[]>>({});
  const [entryText, setEntryText] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── DATA ──────────────────────────────────────────────────────────────────
  async function load() {
    if (!session?.user) return;

    const { data: projectsData, error: projectsError } = await supabase
      .from("projects")
      .select("id, title")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .order("deposit_amount", { ascending: false });

    if (projectsError) {
      console.error("journal: projects fetch failed", projectsError);
    }

    const fetchedProjects = projectsData ?? [];
    setProjects(fetchedProjects);

    const first = fetchedProjects[0] ?? null;
    if (first) {
      setSelectedId(first.id);
      await loadEntries(fetchedProjects.map((p) => p.id));
    }

    setLoading(false);
  }

  async function loadEntries(projectIds: string[]) {
    if (projectIds.length === 0) return;

    const { data, error: entriesError } = await supabase
      .from("journal_entries")
      .select("id, project_id, entry_text, ai_response, created_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false });

    if (entriesError) {
      console.error("journal: entries fetch failed", entriesError);
    }

    const grouped: Record<string, JournalEntry[]> = {};
    for (const entry of data ?? []) {
      if (!grouped[entry.project_id]) grouped[entry.project_id] = [];
      grouped[entry.project_id].push(entry);
    }
    setEntriesByProject(grouped);
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
  async function handleSubmit() {
    const trimmed = entryText.trim();
    if (!trimmed || !selectedId) return;

    setSubmitting(true);
    setError(null);

    const { data, error: submitError } = await apiPost<{ entry: JournalEntry }>(
      "/api/journal",
      { project_id: selectedId, entry_text: trimmed }
    );

    if (submitError || !data) {
      console.error("journal: submit failed", submitError);
      setError(submitError ?? "Failed to submit entry");
    } else {
      setEntriesByProject((current) => ({
        ...current,
        [selectedId]: [data.entry, ...(current[selectedId] ?? [])],
      }));
      setEntryText("");
    }

    setSubmitting(false);
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

  const selectedEntries = selectedId ? (entriesByProject[selectedId] ?? []) : [];

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
            <Text className="text-2xl font-bold text-[#F0EDEA]">Journal</Text>
            <Text className="text-sm text-[#6B6B6B]">Reflect on your week.</Text>
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
                  onPress={() => setSelectedId(p.id)}
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
            <TextInput
              value={entryText}
              onChangeText={setEntryText}
              placeholder="What happened this week?"
              placeholderTextColor="#6B6B6B"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              className="px-4 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] text-sm min-h-[120px]"
            />
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting || !entryText.trim()}
              className="py-4 bg-[#C9A84C] rounded-md items-center disabled:opacity-40"
            >
              <Text className="text-base font-semibold text-[#0A0A0A]">
                {submitting ? "Thinking…" : "Submit entry"}
              </Text>
            </TouchableOpacity>
            {error && (
              <Text className="text-sm text-[#7B2D2D]">{error}</Text>
            )}
          </View>

          <View className="gap-3">
            <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
              History
            </Text>
            {selectedEntries.length === 0 ? (
              <Text className="text-sm text-[#6B6B6B]">
                No entries yet for this project.
              </Text>
            ) : (
              <View className="gap-4">
                {selectedEntries.map((entry) => (
                  <View
                    key={entry.id}
                    className="gap-2 px-5 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md"
                  >
                    <Text className="text-xs text-[#6B6B6B]">
                      {formatDate(entry.created_at)}
                    </Text>
                    <Text className="text-sm text-[#F0EDEA] leading-relaxed">
                      {entry.entry_text}
                    </Text>
                    {entry.ai_response && (
                      <Text className="text-sm text-[#C9A84C] leading-relaxed">
                        {entry.ai_response}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
