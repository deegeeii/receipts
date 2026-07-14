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

// ── HELPERS ───────────────────────────────────────────────────────────────────
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

// ── SCREEN ────────────────────────────────────────────────────────────────────
export default function BasicsScreen() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState<"week" | "month">("week");

  function handleContinue() {
    const start_date = new Date().toISOString().slice(0, 10);
    const end_date = addDays(start_date, duration === "week" ? 7 : 28);

    createProjectStore.set({
      title: title.trim(),
      description: description.trim(),
      duration,
      start_date,
      end_date,
    });

    router.push("/create-project/workweek");
  }

  const canContinue = title.trim().length > 0 && description.trim().length > 0;

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
              What are you working on?
            </Text>
            <Text className="text-sm text-[#6B6B6B]">
              Name it. Make it real.
            </Text>
          </View>

          <View className="gap-5">

            <View className="gap-2">
              <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                Project title
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Project title"
                placeholderTextColor="#6B6B6B"
                className="px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-sm text-[#F0EDEA]"
              />
            </View>

            <View className="gap-2">
              <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                What does done look like?
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What does done look like?"
                placeholderTextColor="#6B6B6B"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-sm text-[#F0EDEA]"
                style={{ minHeight: 80 }}
              />
            </View>

            <View className="gap-2">
              <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                Duration
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setDuration("week")}
                  className={`flex-1 py-3 rounded-md border items-center ${
                    duration === "week"
                      ? "border-[#C9A84C] bg-[#111111]"
                      : "border-[#1F1F1F] bg-[#111111]"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      duration === "week" ? "text-[#F0EDEA]" : "text-[#6B6B6B]"
                    }`}
                  >
                    One week
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDuration("month")}
                  className={`flex-1 py-3 rounded-md border items-center ${
                    duration === "month"
                      ? "border-[#C9A84C] bg-[#111111]"
                      : "border-[#1F1F1F] bg-[#111111]"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      duration === "month" ? "text-[#F0EDEA]" : "text-[#6B6B6B]"
                    }`}
                  >
                    One month
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
