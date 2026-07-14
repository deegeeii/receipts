// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth";
import { apiPost } from "@/lib/api";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Profile = {
  name: string | null;
  level: number;
  current_streak: number;
  invite_code: string;
  ai_voice: string;
};

type Buddy = {
  id: string;
  name: string | null;
  level: number;
  current_streak: number;
};

type Match = {
  id: string;
  name: string | null;
  level: number;
  current_streak: number;
  invite_code: string;
};

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const VOICES = ["warm", "coach", "mentor", "challenger", "mamba"] as const;
type AiVoice = (typeof VOICES)[number];

const VOICE_LABELS: Record<AiVoice, string> = {
  warm: "Warm",
  coach: "Coach",
  mentor: "Mentor",
  challenger: "Challenger",
  mamba: "Mamba",
};

// ── SCREEN ────────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { session } = useAuth();
  const router = useRouter();

  // ── STATE ──────────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<Profile | null>(null);
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const [match, setMatch] = useState<Match | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchAdding, setMatchAdding] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  const [voiceUpdating, setVoiceUpdating] = useState(false);

  // ── DATA ───────────────────────────────────────────────────────────────────
  async function load() {
    if (!session?.user) return;

    const [profileRes, buddiesRes] = await Promise.all([
      supabase
        .from("users")
        .select("name, level, current_streak, invite_code, ai_voice")
        .eq("id", session.user.id)
        .single(),
      supabase.rpc("get_my_buddies"),
    ]);

    if (profileRes.error) {
      console.error("settings: profile fetch failed", profileRes.error);
    }
    if (buddiesRes.error) {
      console.error("settings: buddies fetch failed", buddiesRes.error);
    }

    setProfile((profileRes.data as Profile) ?? null);
    setBuddies((buddiesRes.data as Buddy[]) ?? []);
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

  // ── HANDLERS ───────────────────────────────────────────────────────────────
  async function handleShareCode() {
    if (!profile?.invite_code) return;
    try {
      await Share.share({ message: profile.invite_code });
    } catch (err) {
      console.error("settings: share failed", err);
    }
  }

  async function handleRedeem() {
    const trimmed = redeemCode.trim();
    if (!trimmed) return;
    setRedeeming(true);
    setRedeemError(null);

    const { data, error } = await apiPost<{ buddy: Buddy }>(
      "/api/crew/redeem",
      { code: trimmed }
    );

    if (error) {
      console.error("settings: redeem failed", error);
      setRedeemError(error);
      setRedeeming(false);
      return;
    }

    if (data?.buddy) {
      setBuddies((prev) => [...prev, data.buddy]);
    }

    setRedeemCode("");
    setRedeeming(false);
  }

  async function handleFindMatch() {
    setMatchLoading(true);
    setMatchError(null);
    setMatch(null);

    const { data, error } = await apiPost<{ match: Match | null }>(
      "/api/crew/match",
      {}
    );

    if (error) {
      console.error("settings: find match failed", error);
      setMatchError(error);
      setMatchLoading(false);
      return;
    }

    if (!data?.match) {
      setMatchError("No matches at your level right now. Check back soon.");
      setMatchLoading(false);
      return;
    }

    setMatch(data.match);
    setMatchLoading(false);
  }

  async function handleAddMatch() {
    if (!match) return;
    setMatchAdding(true);
    setMatchError(null);

    const { data, error } = await apiPost<{ buddy: Buddy }>(
      "/api/crew/redeem",
      { code: match.invite_code }
    );

    if (error) {
      console.error("settings: add match failed", error);
      setMatchError(error);
      setMatchAdding(false);
      return;
    }

    if (data?.buddy) {
      setBuddies((prev) => [...prev, data.buddy]);
    }

    setMatch(null);
    setMatchAdding(false);
  }

  async function handleVoiceChange(voice: AiVoice) {
    if (!session?.user || voiceUpdating) return;
    setVoiceUpdating(true);

    const { error } = await supabase
      .from("users")
      .update({ ai_voice: voice })
      .eq("id", session.user.id);

    if (error) {
      console.error("settings: voice update failed", error);
      Alert.alert("Error", "Could not update voice.");
    } else {
      setProfile((prev) => (prev ? { ...prev, ai_voice: voice } : prev));
    }

    setVoiceUpdating(false);
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("settings: sign out failed", error);
      Alert.alert("Error", "Could not sign out.");
      return;
    }
    router.replace("/");
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────
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
        contentContainerClassName="px-6 py-10 gap-10"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#C9A84C"
          />
        }
      >

        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-sm text-[#6B6B6B]">← Back</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-[#F0EDEA]">Settings</Text>

        {/* ── PROFILE ────────────────────────────────────────────────────── */}
        <View className="gap-3">
          <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
            Profile
          </Text>
          <View className="px-5 py-5 bg-[#111111] border border-[#1F1F1F] rounded-md gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-sm font-semibold text-[#F0EDEA]">
                {profile?.name ?? "—"}
              </Text>
              <Text className="text-xs text-[#6B6B6B]">
                Level {profile?.level ?? 1}
              </Text>
            </View>
            <Text className="text-xs text-[#6B6B6B]">
              {profile?.current_streak ?? 0} day streak
            </Text>
          </View>
        </View>

        {/* ── CREW ───────────────────────────────────────────────────────── */}
        <View className="gap-5">
          <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
            Crew
          </Text>

          {/* Invite code */}
          <View className="gap-2">
            <Text className="text-xs text-[#6B6B6B]">Your invite code</Text>
            <View className="flex-row gap-2">
              <View className="flex-1 px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md justify-center">
                <Text className="text-sm font-mono text-[#F0EDEA] tracking-wide">
                  {profile?.invite_code ?? "—"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleShareCode}
                className="px-5 py-3 border border-[#1F1F1F] rounded-md justify-center"
              >
                <Text className="text-sm font-semibold text-[#F0EDEA]">
                  Share
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Add a buddy */}
          <View className="gap-2">
            <Text className="text-xs text-[#6B6B6B]">Add a buddy</Text>
            <View className="flex-row gap-2">
              <TextInput
                value={redeemCode}
                onChangeText={setRedeemCode}
                placeholder="Enter their invite code"
                placeholderTextColor="#6B6B6B"
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-sm text-[#F0EDEA]"
              />
              <TouchableOpacity
                onPress={handleRedeem}
                disabled={redeeming || !redeemCode.trim()}
                className="px-5 py-3 bg-[#C9A84C] rounded-md justify-center"
              >
                <Text className="text-sm font-semibold text-[#0A0A0A]">
                  {redeeming ? "Adding…" : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
            {redeemError && (
              <Text className="text-sm text-[#7B2D2D]">{redeemError}</Text>
            )}
          </View>

          {/* Accountability match */}
          <View className="gap-2">
            {!match && (
              <TouchableOpacity
                onPress={handleFindMatch}
                disabled={matchLoading}
                className="py-3 bg-[#111111] border border-[#1F1F1F] rounded-md items-center"
              >
                <Text className="text-sm font-semibold text-[#6B6B6B]">
                  {matchLoading ? "Looking…" : "Find an accountability match"}
                </Text>
              </TouchableOpacity>
            )}

            {match && (
              <View className="px-5 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md gap-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm font-semibold text-[#F0EDEA]">
                    {match.name ?? "Anonymous"}
                  </Text>
                  <Text className="text-xs text-[#6B6B6B]">
                    Lv {match.level} · {match.current_streak} day streak
                  </Text>
                </View>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setMatch(null)}
                    className="flex-1 py-3 border border-[#1F1F1F] rounded-md items-center"
                  >
                    <Text className="text-sm font-semibold text-[#6B6B6B]">
                      Pass
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddMatch}
                    disabled={matchAdding}
                    className="flex-1 py-3 bg-[#C9A84C] rounded-md items-center"
                  >
                    <Text className="text-sm font-semibold text-[#0A0A0A]">
                      {matchAdding ? "Adding…" : "Add them"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {matchError && (
              <Text className="text-sm text-[#7B2D2D]">{matchError}</Text>
            )}
          </View>

          {/* Buddy list */}
          <View className="gap-2">
            <Text className="text-xs text-[#6B6B6B]">Your buddies</Text>
            {buddies.length === 0 ? (
              <Text className="text-sm text-[#6B6B6B]">
                No buddies yet. Share your code or find a match above.
              </Text>
            ) : (
              <View className="gap-2">
                {buddies.map((buddy) => (
                  <View
                    key={buddy.id}
                    className="flex-row justify-between items-center px-5 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md"
                  >
                    <Text className="text-sm font-semibold text-[#F0EDEA]">
                      {buddy.name ?? "Anonymous"}
                    </Text>
                    <Text className="text-xs text-[#6B6B6B]">
                      Lv {buddy.level} · {buddy.current_streak} day streak
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ── ACCOUNT ────────────────────────────────────────────────────── */}
        <View className="gap-5">
          <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
            Account
          </Text>

          {/* AI voice */}
          <View className="gap-2">
            <Text className="text-xs text-[#6B6B6B]">AI voice</Text>
            <View className="flex-row flex-wrap gap-2">
              {VOICES.map((v) => {
                const active = profile?.ai_voice === v;
                return (
                  <TouchableOpacity
                    key={v}
                    onPress={() => handleVoiceChange(v)}
                    disabled={voiceUpdating}
                    className={`px-4 py-2 rounded-md border ${
                      active
                        ? "bg-[#C9A84C]/10 border-[#C9A84C]"
                        : "bg-[#111111] border-[#1F1F1F]"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        active ? "text-[#C9A84C]" : "text-[#6B6B6B]"
                      }`}
                    >
                      {VOICE_LABELS[v]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Sign out */}
          <TouchableOpacity
            onPress={handleSignOut}
            className="py-4 border border-[#7B2D2D] rounded-md items-center"
          >
            <Text className="text-sm font-semibold text-[#7B2D2D]">
              Sign out
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
