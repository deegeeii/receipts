// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth";
import StatBar from "@/components/dashboard/StatBar";
import ProjectCard from "@/components/dashboard/ProjectCard";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Profile = {
  name: string | null;
  level: number;
  xp: number;
  current_streak: number;
  timezone: string | null;
};

type Project = {
  id: string;
  title: string;
  deposit_amount: number;
  daily_payout: number;
  end_date: string;
};

type Task = {
  id: string;
  title: string;
  completed: boolean;
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
function getTodayInTimezone(timezone: string | null): string {
  const tz = timezone ?? "UTC";
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
}

// ── SCREEN ────────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  // ── STATE ─────────────────────────────────────────────────────────────────
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [receiptDayActive, setReceiptDayActive] = useState(false);
  const [receiptDayMultiplier, setReceiptDayMultiplier] = useState(2);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── DATA ──────────────────────────────────────────────────────────────────
  async function load() {
    if (!session?.user) return;

    const [profileRes, projectsRes, receiptRes] = await Promise.all([
      supabase
        .from("users")
        .select("name, level, xp, current_streak, timezone")
        .eq("id", session.user.id)
        .single(),
      supabase
        .from("projects")
        .select("id, title, deposit_amount, daily_payout, end_date")
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .order("deposit_amount", { ascending: false }),
      supabase
        .from("app_events")
        .select("active, multiplier")
        .eq("event_type", "receipt_day")
        .single(),
    ]);

    if (profileRes.error) console.error("dashboard: profile fetch failed", profileRes.error);
    if (projectsRes.error) console.error("dashboard: projects fetch failed", projectsRes.error);

    const fetchedProfile = profileRes.data ?? null;
    const fetchedProjects = projectsRes.data ?? [];

    setProfile(fetchedProfile);
    setProjects(fetchedProjects);
    setReceiptDayActive(receiptRes.data?.active ?? false);
    setReceiptDayMultiplier(receiptRes.data?.multiplier ?? 2);

    const project = fetchedProjects[0] ?? null;
    if (project) {
      setSelectedId(project.id);
      await loadProject(project.id, fetchedProfile?.timezone ?? null);
    }

    setLoading(false);
  }

  async function loadProject(projectId: string, timezone: string | null) {
    const today = getTodayInTimezone(timezone);

    const [checkInRes, tasksRes, payoutsRes] = await Promise.all([
      supabase
        .from("check_ins")
        .select("id")
        .eq("project_id", projectId)
        .eq("check_in_date", today)
        .single(),
      supabase
        .from("project_tasks")
        .select("id, title, completed")
        .eq("project_id", projectId)
        .order("position", { ascending: true }),
      supabase
        .from("payouts")
        .select("amount")
        .eq("project_id", projectId)
        .eq("status", "released"),
    ]);

    setCheckedInToday(!!checkInRes.data);
    setTasks((tasksRes.data ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
    })));

    const totalReleased = (payoutsRes.data ?? []).reduce(
      (sum, p) => sum + p.amount,
      0
    );
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setRemainingBalance(project.deposit_amount - totalReleased);
    }
  }

  async function switchProject(projectId: string) {
    setSelectedId(projectId);
    await loadProject(projectId, profile?.timezone ?? null);
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
  const selectedProject = projects.find((p) => p.id === selectedId) ?? null;
  const today = getTodayInTimezone(profile?.timezone ?? null);

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

        <StatBar
          name={profile?.name ?? null}
          level={profile?.level ?? 1}
          xp={profile?.xp ?? 0}
          streak={profile?.current_streak ?? 0}
        />

        {receiptDayActive && (
          <View className="px-4 py-3 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-md flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-[#C9A84C]">
              Receipt Day is live
            </Text>
            <View className="px-2 py-1 bg-[#C9A84C] rounded">
              <Text className="text-xs font-bold text-[#0A0A0A]">
                {receiptDayMultiplier}x
              </Text>
            </View>
          </View>
        )}

        {projects.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row gap-2"
            contentContainerClassName="gap-2"
          >
            {projects.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => switchProject(p.id)}
                className={`px-4 py-2 rounded-full border ${
                  p.id === selectedId
                    ? "bg-[#C9A84C] border-[#C9A84C]"
                    : "border-[#1F1F1F]"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    p.id === selectedId ? "text-[#0A0A0A]" : "text-[#6B6B6B]"
                  }`}
                >
                  {p.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {selectedProject ? (
          <ProjectCard
            id={selectedProject.id}
            title={selectedProject.title}
            dailyPayout={selectedProject.daily_payout}
            depositAmount={selectedProject.deposit_amount}
            remainingBalance={remainingBalance}
            endDate={selectedProject.end_date}
            checkedInToday={checkedInToday}
            streak={profile?.current_streak ?? 0}
            tasks={tasks}
            today={today}
          />
        ) : (
          <View className="flex flex-col gap-4 items-center py-10">
            <Text className="text-sm text-[#6B6B6B] text-center">
              No active project yet. Time to put something on the line.
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
