// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { createProjectStore } from "@/lib/createProjectStore";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const MIN_TASKS = 5;
const MAX_TASKS = 10;

// ── SCREEN ────────────────────────────────────────────────────────────────────
export default function RoadmapScreen() {
  const router = useRouter();
  const store = createProjectStore.get();

  const [tasks, setTasks] = useState<string[]>(["", "", "", "", ""]);

  function handleTaskChange(index: number, value: string) {
    setTasks((prev) => prev.map((t, i) => (i === index ? value : t)));
  }

  function handleAddTask() {
    if (tasks.length < MAX_TASKS) {
      setTasks((prev) => [...prev, ""]);
    }
  }

  function handleRemoveTask(index: number) {
    if (tasks.length > 1) {
      setTasks((prev) => prev.filter((_, i) => i !== index));
    }
  }

  function handleContinue() {
    const filled = tasks.map((t) => t.trim()).filter((t) => t.length > 0);
    createProjectStore.set({ tasks: filled });
    router.push("/create-project/review");
  }

  const filledCount = tasks.filter((t) => t.trim().length > 0).length;
  const canContinue = filledCount >= MIN_TASKS;

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="px-6 py-10 gap-8"
          keyboardShouldPersistTaps="handled"
        >

          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-sm text-[#6B6B6B]">← Back</Text>
          </TouchableOpacity>

          <View className="gap-1">
            <Text className="text-2xl font-bold text-[#F0EDEA]">
              Lay out your roadmap.
            </Text>
            <Text className="text-sm text-[#6B6B6B]">
              Break {store.title} into {MIN_TASKS}–{MAX_TASKS} steps.
            </Text>
          </View>

          <View className="gap-3">
            {tasks.map((task, index) => (
              <View key={index} className="flex-row items-center gap-2">
                <TextInput
                  value={task}
                  onChangeText={(v) => handleTaskChange(index, v)}
                  placeholder={`Step ${index + 1}`}
                  placeholderTextColor="#6B6B6B"
                  className="flex-1 px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-sm text-[#F0EDEA]"
                />
                {tasks.length > 1 && (
                  <TouchableOpacity
                    onPress={() => handleRemoveTask(index)}
                    className="px-2"
                  >
                    <Text className="text-sm text-[#6B6B6B]">✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {tasks.length < MAX_TASKS && (
            <TouchableOpacity
              onPress={handleAddTask}
              className="py-3 border border-[#1F1F1F] rounded-md items-center"
            >
              <Text className="text-sm text-[#6B6B6B]">+ Add a step</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleContinue}
            disabled={!canContinue}
            className="py-4 bg-[#C9A84C] rounded-md items-center"
          >
            <Text className="text-base font-semibold text-[#0A0A0A]">
              Continue ({filledCount}/{MIN_TASKS} min)
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
