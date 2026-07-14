// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { createProjectStore } from "@/lib/createProjectStore";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const TIERS = [
  { amount: 5000, label: "$50", multiplier: "1x XP" },
  { amount: 10000, label: "$100", multiplier: "1.5x XP" },
  { amount: 25000, label: "$250", multiplier: "2.5x XP" },
  { amount: 50000, label: "$500", multiplier: "3.5x XP" },
  { amount: 100000, label: "$1,000", multiplier: "5x XP" },
];

// ── SCREEN ────────────────────────────────────────────────────────────────────
export default function DepositScreen() {
  const router = useRouter();

  function handleSelect(amount: number) {
    createProjectStore.reset();
    createProjectStore.set({ deposit_amount: amount });
    router.push("/create-project/basics");
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <View className="flex-1 px-6 py-10 gap-8">

        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-sm text-[#6B6B6B]">← Back</Text>
        </TouchableOpacity>

        <View className="gap-1">
          <Text className="text-2xl font-bold text-[#F0EDEA]">
            What's it worth to you?
          </Text>
          <Text className="text-sm text-[#6B6B6B]">
            Higher stakes earn faster XP.
          </Text>
        </View>

        <View className="gap-3">
          {TIERS.map((tier) => (
            <TouchableOpacity
              key={tier.amount}
              onPress={() => handleSelect(tier.amount)}
              className="flex-row justify-between items-center px-5 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md"
            >
              <Text className="text-lg font-semibold text-[#F0EDEA]">
                {tier.label}
              </Text>
              <Text className="text-xs text-[#6B6B6B] tracking-wide">
                {tier.multiplier}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

      </View>
    </SafeAreaView>
  );
}
