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

// ── SCREEN ────────────────────────────────────────────────────────────────────
export default function DaysScreen() {
  const router = useRouter();

  const [goodDay, setGoodDay] = useState("");
  const [hardDay, setHardDay] = useState("");

  function handleContinue() {
    createProjectStore.set({
      good_day_description: goodDay.trim(),
      hard_day_description: hardDay.trim(),
    });
    router.push("/create-project/roadmap");
  }

  const canContinue = goodDay.trim().length > 0 && hardDay.trim().length > 0;

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
              Two more things.
            </Text>
            <Text className="text-sm text-[#6B6B6B]">
              This is what the app will remember about you.
            </Text>
          </View>

          <View className="gap-5">

            <View className="gap-2">
              <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                What does a good day look like for this?
              </Text>
              <TextInput
                value={goodDay}
                onChangeText={setGoodDay}
                placeholder="I sit down and just start. An hour goes by and I've made real progress."
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
                What does a hard day look like?
              </Text>
              <TextInput
                value={hardDay}
                onChangeText={setHardDay}
                placeholder="I open it, stare at it, and close it again."
                placeholderTextColor="#6B6B6B"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-sm text-[#F0EDEA]"
                style={{ minHeight: 80 }}
              />
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
