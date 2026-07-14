// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { createProjectStore } from "@/lib/createProjectStore";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const DAYS = [
  { index: 0, label: "Sun" },
  { index: 1, label: "Mon" },
  { index: 2, label: "Tue" },
  { index: 3, label: "Wed" },
  { index: 4, label: "Thu" },
  { index: 5, label: "Fri" },
  { index: 6, label: "Sat" },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

// ── SCREEN ────────────────────────────────────────────────────────────────────
export default function WorkweekScreen() {
  const router = useRouter();
  const store = createProjectStore.get();

  const [selected, setSelected] = useState<number[]>(store.work_days);

  function toggleDay(index: number) {
    setSelected((prev) => {
      if (prev.includes(index)) return prev.filter((d) => d !== index);
      if (prev.length >= 5) return prev;
      return [...prev, index];
    });
  }

  function handleContinue() {
    const totalWorkDays = store.duration === "week" ? 5 : 20;
    const daily_payout = store.deposit_amount
      ? Math.round(store.deposit_amount / totalWorkDays)
      : null;

    createProjectStore.set({ work_days: selected, daily_payout });
    router.push("/create-project/quiz");
  }

  const canContinue = selected.length === 5;

  const previewPayout =
    store.deposit_amount && canContinue
      ? formatCents(
          Math.round(
            store.deposit_amount / (store.duration === "week" ? 5 : 20)
          )
        )
      : null;

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <View className="flex-1 px-6 py-10 gap-8">

        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-sm text-[#6B6B6B]">← Back</Text>
        </TouchableOpacity>

        <View className="gap-1">
          <Text className="text-2xl font-bold text-[#F0EDEA]">
            Your work week.
          </Text>
          <Text className="text-sm text-[#6B6B6B]">
            Pick your 5 days. The rest are yours.
          </Text>
        </View>

        <View className="flex-row gap-2">
          {DAYS.map((day) => {
            const isSelected = selected.includes(day.index);
            const isDisabled = !isSelected && selected.length >= 5;

            return (
              <TouchableOpacity
                key={day.index}
                onPress={() => toggleDay(day.index)}
                disabled={isDisabled}
                className={`flex-1 py-3 rounded-md border items-center ${
                  isSelected
                    ? "border-[#C9A84C] bg-[#C9A84C]"
                    : isDisabled
                    ? "border-[#1F1F1F]"
                    : "border-[#1F1F1F] bg-[#111111]"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isSelected
                      ? "text-[#0A0A0A]"
                      : isDisabled
                      ? "text-[#3A3A3A]"
                      : "text-[#6B6B6B]"
                  }`}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {previewPayout && (
          <Text className="text-sm text-center text-[#6B6B6B]">
            You'll earn{" "}
            <Text className="text-[#C9A84C] font-semibold">
              {previewPayout}
            </Text>{" "}
            per day you show up.
          </Text>
        )}

        <TouchableOpacity
          onPress={handleContinue}
          disabled={!canContinue}
          className="py-4 bg-[#C9A84C] rounded-md items-center"
        >
          <Text className="text-base font-semibold text-[#0A0A0A]">
            Continue
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}
