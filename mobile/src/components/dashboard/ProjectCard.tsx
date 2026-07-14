// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Task = {
  id: string;
  title: string;
  completed: boolean;
};

type Props = {
  id: string;
  title: string;
  dailyPayout: number;
  depositAmount: number;
  remainingBalance: number;
  endDate: string;
  checkedInToday: boolean;
  streak: number;
  tasks: Task[];
  today: string;
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function ProjectCard({
  id,
  title,
  dailyPayout,
  depositAmount,
  remainingBalance,
  endDate,
  checkedInToday,
  streak,
  tasks,
  today,
}: Props) {
  const router = useRouter();
  const isOverdue = endDate < today;

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <View className="flex flex-col gap-4 px-5 py-5 bg-[#111111] border border-[#1F1F1F] rounded-md">

      <View className="flex-row justify-between items-start">
        <Text className="text-base font-bold text-[#F0EDEA] flex-1 pr-4">
          {title}
        </Text>
        {isOverdue && (
          <View className="px-2 py-1 bg-[#7B2D2D]/20 border border-[#7B2D2D]/40 rounded">
            <Text className="text-xs text-[#7B2D2D] font-semibold">Overdue</Text>
          </View>
        )}
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 px-3 py-3 bg-[#0A0A0A] border border-[#1F1F1F] rounded-md">
          <Text className="text-xs text-[#6B6B6B]">Remaining</Text>
          <Text className="text-sm font-semibold text-[#F0EDEA] mt-1">
            ${(remainingBalance / 100).toFixed(2)}
          </Text>
        </View>
        <View className="flex-1 px-3 py-3 bg-[#0A0A0A] border border-[#1F1F1F] rounded-md">
          <Text className="text-xs text-[#6B6B6B]">Daily payout</Text>
          <Text className="text-sm font-semibold text-[#C9A84C] mt-1">
            ${(dailyPayout / 100).toFixed(2)}
          </Text>
        </View>
        <View className="flex-1 px-3 py-3 bg-[#0A0A0A] border border-[#1F1F1F] rounded-md">
          <Text className="text-xs text-[#6B6B6B]">Streak</Text>
          <Text className="text-sm font-semibold text-[#F0EDEA] mt-1">
            {streak} days
          </Text>
        </View>
      </View>

      {tasks.length > 0 && (
        <View className="flex flex-col gap-2">
          <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
            Today's tasks
          </Text>
          {tasks.slice(0, 4).map((task) => (
            <View key={task.id} className="flex-row items-center gap-3">
              <View
                className={`w-4 h-4 rounded-sm border ${
                  task.completed
                    ? "bg-[#C9A84C] border-[#C9A84C]"
                    : "border-[#1F1F1F]"
                }`}
              />
              <Text
                className={`text-sm flex-1 ${
                  task.completed
                    ? "text-[#6B6B6B] line-through"
                    : "text-[#F0EDEA]"
                }`}
              >
                {task.title}
              </Text>
            </View>
          ))}
        </View>
      )}

      {checkedInToday ? (
        <View className="py-4 border border-[#1F1F1F] rounded-md items-center">
          <Text className="text-sm font-semibold text-[#6B6B6B]">
            Checked in today ✓
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => router.push(`/check-in/${id}`)}
          className="py-4 bg-[#C9A84C] rounded-md items-center"
        >
          <Text className="text-[#0A0A0A] font-semibold text-base">
          Drop Receipt
          </Text>
        </TouchableOpacity>
      )}

    </View>
  );
}
