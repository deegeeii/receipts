// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── SCREEN ────────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <View className="flex-1 items-center justify-center">
        <Text className="text-[#F0EDEA] text-lg font-bold">Dashboard</Text>
        <Text className="text-[#6B6B6B] text-sm mt-1">Coming in Slice B</Text>
      </View>
    </SafeAreaView>
  );
}
