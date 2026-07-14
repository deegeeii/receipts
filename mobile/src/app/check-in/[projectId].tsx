// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiPost } from "@/lib/api";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Mode = "receipt" | "light_day" | "heavy_day" | "rest_day";
type Step = "write" | "question" | "done";

type QuestionResponse = {
  question?: string;
  skip?: boolean;
};

type VerifyResponse = {
  closing_message: string;
  xp_earned: number;
  payout_amount: number;
  new_level: number;
  leveled_up: boolean;
  streak_reset: boolean;
  buddy_bonus_xp: number;
  buddy_match_names: string[];
};

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const MODES: { key: Mode; label: string; description: string }[] = [
  { key: "receipt",   label: "Receipt",   description: "Standard check-in" },
  { key: "light_day", label: "Light day", description: "Quick log, lower XP" },
  { key: "heavy_day", label: "Peak day",  description: "Deep work, 1.25× XP" },
  { key: "rest_day",  label: "Rest day",  description: "Scheduled off day" },
];

// ── SCREEN ────────────────────────────────────────────────────────────────────
export default function CheckInScreen() {
  // ── STATE ─────────────────────────────────────────────────────────────────
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("receipt");
  const [receiptText, setReceiptText] = useState("");
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [step, setStep] = useState<Step>("write");
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── HANDLERS ──────────────────────────────────────────────────────────────
  async function handleContinue() {
    if (!receiptText.trim() && mode !== "rest_day") return;

    setLoading(true);
    setError(null);

    if (mode === "rest_day") {
      await handleVerify("", "");
      return;
    }

    const { data, error: qErr } = await apiPost<QuestionResponse>(
      "/api/check-in/question",
      { project_id: projectId, receipt_text: receiptText, mode }
    );

    if (qErr || !data) {
      setError(qErr ?? "Failed to generate question");
      setLoading(false);
      return;
    }

    if (data.skip) {
      await handleVerify("", "");
      return;
    }

    setAiQuestion(data.question ?? "");
    setStep("question");
    setLoading(false);
  }

  async function handleVerify(question: string, response: string) {
    setLoading(true);
    setError(null);

    const { data, error: vErr } = await apiPost<VerifyResponse>(
      "/api/check-in/verify",
      {
        project_id: projectId,
        receipt_text: receiptText,
        ai_question: question,
        ai_response: response,
        mode,
      }
    );

    if (vErr || !data) {
      setError(vErr ?? "Verification failed");
      setLoading(false);
      return;
    }

    setResult(data);
    setStep("done");
    setLoading(false);
  }

  // ── RENDER: WRITE ──────────────────────────────────────────────────────────
  if (step === "write") {
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

            <View className="gap-1">
              <Text className="text-xs text-[#6B6B6B] uppercase tracking-widest">
                Receipt
              </Text>
              <Text className="text-2xl font-bold text-[#F0EDEA]">
                Drop your receipt
              </Text>
            </View>

            <View className="gap-2">
              <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                Mode
              </Text>
              <View className="gap-2">
                {MODES.map((m) => (
                  <TouchableOpacity
                    key={m.key}
                    onPress={() => setMode(m.key)}
                    className={`flex-row justify-between items-center px-4 py-3 rounded-md border ${
                      mode === m.key
                        ? "border-[#C9A84C] bg-[#C9A84C]/5"
                        : "border-[#1F1F1F] bg-[#111111]"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        mode === m.key ? "text-[#C9A84C]" : "text-[#F0EDEA]"
                      }`}
                    >
                      {m.label}
                    </Text>
                    <Text className="text-xs text-[#6B6B6B]">
                      {m.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {mode !== "rest_day" && (
              <View className="gap-2">
                <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                  What did you do today?
                </Text>
                <TextInput
                  value={receiptText}
                  onChangeText={setReceiptText}
                  placeholder="Write your receipt…"
                  placeholderTextColor="#6B6B6B"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  className="px-4 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] text-sm min-h-[140px]"
                />
              </View>
            )}

            {error && (
              <Text className="text-sm text-[#7B2D2D]">{error}</Text>
            )}

            <TouchableOpacity
              onPress={handleContinue}
              disabled={loading || (mode !== "rest_day" && !receiptText.trim())}
              className="py-4 bg-[#C9A84C] rounded-md items-center disabled:opacity-40"
            >
              {loading ? (
                <ActivityIndicator color="#0A0A0A" />
              ) : (
                <Text className="text-[#0A0A0A] font-semibold text-base">
                  {mode === "rest_day" ? "Log rest day" : "Continue"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              className="items-center"
            >
              <Text className="text-sm text-[#6B6B6B]">← Back</Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── RENDER: QUESTION ───────────────────────────────────────────────────────
  if (step === "question") {
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

            <View className="gap-1">
              <Text className="text-xs text-[#6B6B6B] uppercase tracking-widest">
                Receipt
              </Text>
              <Text className="text-2xl font-bold text-[#F0EDEA]">
                One question
              </Text>
            </View>

            <View className="px-5 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md">
              <Text className="text-sm text-[#F0EDEA] leading-relaxed">
                {aiQuestion}
              </Text>
            </View>

            <TextInput
              value={aiResponse}
              onChangeText={setAiResponse}
              placeholder="Your answer…"
              placeholderTextColor="#6B6B6B"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              autoFocus
              className="px-4 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] text-sm min-h-[120px]"
            />

            {error && (
              <Text className="text-sm text-[#7B2D2D]">{error}</Text>
            )}

            <TouchableOpacity
              onPress={() => handleVerify(aiQuestion, aiResponse)}
              disabled={loading || !aiResponse.trim()}
              className="py-4 bg-[#C9A84C] rounded-md items-center disabled:opacity-40"
            >
              {loading ? (
                <ActivityIndicator color="#0A0A0A" />
              ) : (
                <Text className="text-[#0A0A0A] font-semibold text-base">
                  Verify
                </Text>
              )}
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── RENDER: DONE ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <ScrollView contentContainerClassName="px-6 py-10 gap-8">

        <View className="gap-1">
          <Text className="text-xs text-[#C9A84C] uppercase tracking-widest">
            Receipt dropped
          </Text>
          <Text className="text-2xl font-bold text-[#F0EDEA]">
            Done.
          </Text>
        </View>

        {result?.closing_message ? (
          <View className="px-5 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md">
            <Text className="text-sm text-[#F0EDEA] leading-relaxed">
              {result.closing_message}
            </Text>
          </View>
        ) : null}

        <View className="gap-2">
          <View className="flex-row justify-between items-center px-5 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md">
            <Text className="text-sm text-[#6B6B6B]">XP earned</Text>
            <Text className="text-sm font-semibold text-[#C9A84C]">
              +{result?.xp_earned ?? 0}
            </Text>
          </View>
          <View className="flex-row justify-between items-center px-5 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md">
            <Text className="text-sm text-[#6B6B6B]">Payout</Text>
            <Text className="text-sm font-semibold text-[#F0EDEA]">
              ${((result?.payout_amount ?? 0) / 100).toFixed(2)}
            </Text>
          </View>
          {(result?.buddy_bonus_xp ?? 0) > 0 && (
            <View className="flex-row justify-between items-center px-5 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md">
              <Text className="text-sm text-[#6B6B6B]">Buddy bonus</Text>
              <Text className="text-sm font-semibold text-[#C9A84C]">
                +{result?.buddy_bonus_xp} XP
              </Text>
            </View>
          )}
          {result?.leveled_up && (
            <View className="px-5 py-4 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-md">
              <Text className="text-sm font-semibold text-[#C9A84C]">
                Level up → {result.new_level}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          className="py-4 bg-[#C9A84C] rounded-md items-center"
        >
          <Text className="text-[#0A0A0A] font-semibold text-base">
            Back to dashboard
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
