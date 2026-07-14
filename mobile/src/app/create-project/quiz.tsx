// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { createProjectStore } from "@/lib/createProjectStore";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const OBSTACLE_OPTIONS = [
  { value: "bursts_and_crash", label: "I work in bursts and crash" },
  { value: "start_dont_finish", label: "I start but don't finish" },
  { value: "lose_momentum", label: "I lose momentum after a few days" },
  { value: "dont_know_where_to_start", label: "I don't know where to start" },
  { value: "get_distracted", label: "I get distracted easily" },
];

const WORK_STYLE_OPTIONS = [
  { value: "daily_steps", label: "I take small steps every day" },
  { value: "big_push", label: "I go all-in, then crash" },
  { value: "deadline_driven", label: "Deadlines force me to move" },
  { value: "needs_watching", label: "I need someone checking on me" },
];

// ── SCREEN ────────────────────────────────────────────────────────────────────
export default function QuizScreen() {
  const router = useRouter();

  const [obstaclePatterns, setObstaclePatterns] = useState<string[]>([]);
  const [workStyle, setWorkStyle] = useState<string | null>(null);

  function toggleObstacle(value: string) {
    setObstaclePatterns((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  }

  function handleContinue() {
    createProjectStore.set({
      work_style: workStyle,
      obstacle_patterns: obstaclePatterns,
    });
    router.push("/create-project/days");
  }

  const canContinue = obstaclePatterns.length > 0 && workStyle !== null;

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <ScrollView contentContainerClassName="px-6 py-10 gap-8">

        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-sm text-[#6B6B6B]">← Back</Text>
        </TouchableOpacity>

        <View className="gap-1">
          <Text className="text-2xl font-bold text-[#F0EDEA]">
            How do you actually work?
          </Text>
          <Text className="text-sm text-[#6B6B6B]">
            This shapes how the app shows up for you. Just once.
          </Text>
        </View>

        <View className="gap-3">
          <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
            What gets in your way? (pick any)
          </Text>
          {OBSTACLE_OPTIONS.map((option) => {
            const active = obstaclePatterns.includes(option.value);
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => toggleObstacle(option.value)}
                className={`px-4 py-3 rounded-md border ${
                  active
                    ? "border-[#C9A84C] bg-[#111111]"
                    : "border-[#1F1F1F] bg-[#111111]"
                }`}
              >
                <Text
                  className={`text-sm ${
                    active ? "text-[#F0EDEA]" : "text-[#6B6B6B]"
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="gap-3">
          <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
            How do you move forward?
          </Text>
          {WORK_STYLE_OPTIONS.map((option) => {
            const active = workStyle === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => setWorkStyle(option.value)}
                className={`px-4 py-3 rounded-md border ${
                  active
                    ? "border-[#C9A84C] bg-[#111111]"
                    : "border-[#1F1F1F] bg-[#111111]"
                }`}
              >
                <Text
                  className={`text-sm ${
                    active ? "text-[#F0EDEA]" : "text-[#6B6B6B]"
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={handleContinue}
          disabled={!canContinue}
          className="py-4 bg-[#C9A84C] rounded-md items-center"
        >
          <Text className="text-base font-semibold text-[#0A0A0A]">
            Continue
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
