// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useStripe } from "@stripe/stripe-react-native";
import { createProjectStore } from "@/lib/createProjectStore";
import { apiPost } from "@/lib/api";

// ── HELPERS ───────────────────────────────────────────────────────────────────
function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ── SCREEN ────────────────────────────────────────────────────────────────────
export default function ReviewScreen() {
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const store = createProjectStore.get();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── HANDLERS ───────────────────────────────────────────────────────────────
  async function handleCommit() {
    if (!store.deposit_amount) return;
    setProcessing(true);
    setError(null);

    const { data: intentData, error: intentError } = await apiPost<{
      client_secret: string;
    }>("/api/stripe/payment-intent", { amount: store.deposit_amount });

    if (intentError || !intentData?.client_secret) {
      console.error("review: payment intent failed", intentError);
      setError(intentError ?? "Could not initialize payment.");
      setProcessing(false);
      return;
    }

    const { error: initError } = await initPaymentSheet({
      paymentIntentClientSecret: intentData.client_secret,
      merchantDisplayName: "Receipt",
      appearance: {
        colors: {
          primary: "#C9A84C",
          background: "#111111",
          componentBackground: "#0A0A0A",
          primaryText: "#F0EDEA",
          secondaryText: "#6B6B6B",
          componentBorder: "#1F1F1F",
          placeholderText: "#6B6B6B",
        },
      },
    });

    if (initError) {
      console.error("review: initPaymentSheet failed", initError);
      setError(initError.message ?? "Could not prepare payment.");
      setProcessing(false);
      return;
    }

    const { error: presentError } = await presentPaymentSheet();

    if (presentError) {
      if (presentError.code !== "Canceled") {
        console.error("review: presentPaymentSheet failed", presentError);
        setError(presentError.message ?? "Payment failed.");
      }
      setProcessing(false);
      return;
    }

    const paymentIntentId = intentData.client_secret.split("_secret_")[0];

    const { data: project, error: projectError } = await apiPost<{
      project: { id: string };
    }>("/api/projects", {
      title: store.title,
      description: store.description,
      deposit_amount: store.deposit_amount,
      daily_payout: store.daily_payout,
      start_date: store.start_date,
      end_date: store.end_date,
      work_days: store.work_days,
      work_style: store.work_style,
      obstacle_patterns: store.obstacle_patterns,
      good_day_description: store.good_day_description,
      hard_day_description: store.hard_day_description,
      tasks: store.tasks,
      stripe_payment_intent_id: paymentIntentId,
    });

    if (projectError || !project) {
      console.error("review: project create failed", projectError);
      if (projectError === "upgrade_required") {
        Alert.alert(
          "Project limit reached",
          "Upgrade to Pro to run multiple projects at once."
        );
      } else {
        setError(projectError ?? "Could not create project.");
      }
      setProcessing(false);
      return;
    }

    createProjectStore.reset();
    router.replace("/(tabs)/projects");
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <ScrollView contentContainerClassName="px-6 py-10 gap-8">

        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-sm text-[#6B6B6B]">← Back</Text>
        </TouchableOpacity>

        <View className="gap-1">
          <Text className="text-2xl font-bold text-[#F0EDEA]">
            Lock it in.
          </Text>
          <Text className="text-sm text-[#6B6B6B]">
            Once you confirm, the deposit is on.
          </Text>
        </View>

        <View className="px-5 py-5 bg-[#111111] border border-[#1F1F1F] rounded-md gap-4">
          <View className="flex-row justify-between items-baseline">
            <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
              Project
            </Text>
            <Text className="text-sm font-semibold text-[#F0EDEA]">
              {store.title}
            </Text>
          </View>

          <View className="flex-row justify-between items-baseline">
            <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
              Deposit
            </Text>
            <Text className="text-sm font-semibold text-[#C9A84C]">
              {store.deposit_amount ? formatCents(store.deposit_amount) : "—"}
            </Text>
          </View>

          <View className="flex-row justify-between items-baseline">
            <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
              Daily payout
            </Text>
            <Text className="text-sm font-semibold text-[#F0EDEA]">
              {store.daily_payout ? formatCents(store.daily_payout) : "—"}
            </Text>
          </View>

          <View className="flex-row justify-between items-baseline">
            <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
              Runs
            </Text>
            <Text className="text-sm font-semibold text-[#F0EDEA]">
              {store.start_date ? formatDate(store.start_date) : "—"} —{" "}
              {store.end_date ? formatDate(store.end_date) : "—"}
            </Text>
          </View>

          <View className="flex-row justify-between items-baseline">
            <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
              Work days
            </Text>
            <Text className="text-sm font-semibold text-[#F0EDEA]">
              {store.work_days.length} days/week
            </Text>
          </View>

          <View className="flex-row justify-between items-baseline">
            <Text className="text-xs text-[#6B6B6B] uppercase tracking-wide">
              Roadmap
            </Text>
            <Text className="text-sm font-semibold text-[#F0EDEA]">
              {store.tasks.length} steps
            </Text>
          </View>
        </View>

        {error && (
          <Text className="text-sm text-[#7B2D2D] text-center">{error}</Text>
        )}

        <TouchableOpacity
          onPress={handleCommit}
          disabled={processing}
          className="py-4 bg-[#C9A84C] rounded-md items-center"
        >
          <Text className="text-base font-semibold text-[#0A0A0A]">
            {processing ? "Processing…" : "I'm in. Lock it in."}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
