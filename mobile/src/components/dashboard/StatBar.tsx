// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { View, Text } from "react-native";
import { getLevelGroup } from "@/lib/levels";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Props = {
  name: string | null;
  level: number;
  xp: number;
  streak: number;
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function StatBar({ name, level, xp, streak }: Props) {
  const levelGroup = getLevelGroup(level);

  return (
    <View className="gap-1">
      <Text className="text-2xl font-bold text-[#F0EDEA]">
        {name ? `Welcome back, ${name}` : "Welcome back"}
      </Text>
      <Text className="text-sm text-[#6B6B6B]">
        Level {level} · {levelGroup} · {xp} XP · {streak} day streak
      </Text>
    </View>
  );
}
