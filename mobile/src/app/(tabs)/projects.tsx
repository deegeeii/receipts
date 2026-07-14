// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Project = {
  id: string;
  title: string;
  status: string;
  deposit_amount: number;
  daily_payout: number;
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`;
}

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── SCREEN ────────────────────────────────────────────────────────────────────
export default function ProjectsScreen() {
  const { session } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── DATA ──────────────────────────────────────────────────────────────────
  async function load() {
    if (!session?.user) return;

    const today = getTodayUTC();

    const [projectsRes, checkInsRes] = await Promise.all([
      supabase
        .from("projects")
        .select("id, title, status, deposit_amount, daily_payout")
        .eq("user_id", session.user.id)
        .order("deposit_amount", { ascending: false }),
      supabase
        .from("check_ins")
        .select("project_id")
        .eq("user_id", session.user.id)
        .eq("check_in_date", today),
    ]);

    if (projectsRes.error) {
      console.error("projects: fetch failed", projectsRes.error);
    }
    if (checkInsRes.error) {
      console.error("projects: check_ins fetch failed", checkInsRes.error);
    }

    setProjects(projectsRes.data ?? []);
    setCheckedInIds(new Set((checkInsRes.data ?? []).map((c) => c.project_id)));
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
    }, [session])
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
          <Text className="text-2xl font-bold text-[#F0EDEA]">
            Your projects
          </Text>
          <Text className="text-sm text-[#6B6B6B]">
            Everything you&apos;ve put on the line.
          </Text>
        </View>

        {projects.length === 0 ? (
          <View className="items-center py-10">
            <Text className="text-sm text-[#6B6B6B] text-center">
              No projects yet. Time to put something on the line.
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            {projects.map((project) => {
              const isActive = project.status === "active";
              const checkedInToday = checkedInIds.has(project.id);

              return (
                <View
                  key={project.id}
                  className="gap-4 px-5 py-5 bg-[#111111] border border-[#1F1F1F] rounded-md"
                >
                  <View className="flex-row justify-between items-baseline">
                    <Text className="text-base font-semibold text-[#F0EDEA] flex-1 pr-4">
                      {project.title}
                    </Text>
                    <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                      {project.status}
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-baseline">
                    <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                      Deposit
                    </Text>
                    <Text className="text-sm font-semibold text-[#C9A84C]">
                      {formatCents(project.deposit_amount)}
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-baseline">
                    <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                      Daily payout
                    </Text>
                    <Text className="text-sm font-semibold text-[#F0EDEA]">
                      {formatCents(project.daily_payout)}
                    </Text>
                  </View>

                  <View className="flex-row gap-3">
                    {isActive && (
                      checkedInToday ? (
                        <View className="flex-1 py-3 border border-[#1F1F1F] rounded-md items-center">
                          <Text className="text-sm font-semibold text-[#2D6A4F]">
                            Logged today ✓
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => router.push(`/check-in/${project.id}`)}
                          className="flex-1 py-3 bg-[#C9A84C] rounded-md items-center"
                        >
                          <Text className="text-sm font-semibold text-[#0A0A0A]">
                            Drop receipt
                          </Text>
                        </TouchableOpacity>
                      )
                    )}

                    <TouchableOpacity
                      onPress={() => router.push(`/project/${project.id}/history`)}
                      className="flex-1 py-3 border border-[#1F1F1F] rounded-md items-center"
                    >
                      <Text className="text-sm font-semibold text-[#F0EDEA]">
                        History
                      </Text>
                    </TouchableOpacity>
                  </View>

                </View>
              );
            })}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
