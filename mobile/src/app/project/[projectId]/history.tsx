// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Payout = {
  amount: number;
  status: string;
};

type CheckIn = {
  id: string;
  check_in_date: string;
  receipt_text: string;
  ai_question: string | null;
  ai_response: string | null;
  xp_earned: number;
  payouts: Payout | Payout[] | null;
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function getPayout(raw: Payout | Payout[] | null): Payout | null {
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] ?? null : raw;
}

// ── SCREEN ────────────────────────────────────────────────────────────────────
export default function HistoryScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { session } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── DATA ──────────────────────────────────────────────────────────────────
  async function load() {
    if (!session?.user || !projectId) return;

    const [projectRes, checkInsRes] = await Promise.all([
      supabase
        .from("projects")
        .select("title")
        .eq("id", projectId)
        .eq("user_id", session.user.id)
        .single(),
      supabase
        .from("check_ins")
        .select("id, check_in_date, receipt_text, ai_question, ai_response, xp_earned, payouts(amount, status)")
        .eq("project_id", projectId)
        .order("check_in_date", { ascending: false }),
    ]);

    if (projectRes.error) {
      console.error("history: project fetch failed", projectRes.error);
    }
    if (checkInsRes.error) {
      console.error("history: check_ins fetch failed", checkInsRes.error);
    }

    setTitle(projectRes.data?.title ?? "");
    setCheckIns((checkInsRes.data as CheckIn[]) ?? []);
    setLoading(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [session, projectId])
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#0A0A0A] items-center justify-center">
        <ActivityIndicator color="#C9A84C" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <ScrollView
        contentContainerClassName="px-6 py-10 gap-8"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#C9A84C"
          />
        }
      >

        <View className="gap-1">
          <TouchableOpacity onPress={() => router.back()} className="mb-2">
            <Text className="text-sm text-[#6B6B6B]">← Back</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-[#F0EDEA]">{title}</Text>
          <Text className="text-sm text-[#6B6B6B]">Receipt history</Text>
        </View>

        {checkIns.length === 0 ? (
          <Text className="text-sm text-[#6B6B6B] text-center py-10">
            No receipts yet. Check in to start your ledger.
          </Text>
        ) : (
          <View className="gap-4">
            {checkIns.map((checkIn) => {
              const payout = getPayout(checkIn.payouts);
              const released = payout?.status === "released";

              return (
                <View
                  key={checkIn.id}
                  className="gap-3 px-5 py-5 bg-[#111111] border border-[#1F1F1F] rounded-md"
                >
                  <View className="flex-row justify-between items-baseline">
                    <Text className="text-sm font-semibold text-[#F0EDEA]">
                      {formatDate(checkIn.check_in_date)}
                    </Text>
                    <View className="flex-row items-center gap-3">
                      {payout && (
                        <Text className={`text-xs font-semibold ${released ? "text-[#C9A84C]" : "text-[#6B6B6B]"}`}>
                          {released
                            ? `${formatCents(payout.amount)} released`
                            : `${formatCents(payout.amount)} pending`}
                        </Text>
                      )}
                      <Text className="text-xs font-semibold text-[#C9A84C]">
                        +{checkIn.xp_earned} XP
                      </Text>
                    </View>
                  </View>

                  <Text className="text-sm text-[#F0EDEA] leading-relaxed">
                    {checkIn.receipt_text}
                  </Text>

                  {checkIn.ai_question ? (
                    <View className="gap-1 pt-2 border-t border-[#1F1F1F]">
                      <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                        {checkIn.ai_question}
                      </Text>
                      <Text className="text-sm text-[#F0EDEA] leading-relaxed">
                        {checkIn.ai_response}
                      </Text>
                    </View>
                  ) : null}

                </View>
              );
            })}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
