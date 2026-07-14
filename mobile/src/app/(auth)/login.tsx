// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Step = "email" | "code";

// ── SCREEN ────────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  // ── STATE ─────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── HANDLERS ──────────────────────────────────────────────────────────────
  async function handleSendCode() {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });

    if (error) {
      console.error("login: send OTP failed", error);
      setError(error.message);
      setLoading(false);
      return;
    }

    setStep("code");
    setLoading(false);
  }

  async function handleVerifyCode() {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });

    if (error) {
      console.error("login: verify OTP failed", error);
      setError(error.message);
    }

    setLoading(false);
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center px-6"
      >
        <View className="gap-8">

          <View className="gap-1">
            <Text className="text-xs text-[#6B6B6B] uppercase tracking-widest">
              Receipt
            </Text>
            <Text className="text-2xl font-bold text-[#F0EDEA]">
              {step === "email" ? "Welcome back" : "Check your email"}
            </Text>
            {step === "code" && (
              <Text className="text-sm text-[#6B6B6B]">
                We sent a 6-digit code to {email}
              </Text>
            )}
          </View>

          <View className="gap-3">
            {step === "email" ? (
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor="#6B6B6B"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="px-4 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] text-sm"
              />
            ) : (
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="6-digit code"
                placeholderTextColor="#6B6B6B"
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                className="px-4 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] text-sm tracking-widest text-center"
              />
            )}
            {error && (
              <Text className="text-sm text-[#7B2D2D]">{error}</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={step === "email" ? handleSendCode : handleVerifyCode}
            disabled={loading || (step === "email" ? !email : code.length < 6)}
            className="py-4 bg-[#C9A84C] rounded-md items-center disabled:opacity-40"
          >
            <Text className="text-[#0A0A0A] font-semibold text-base">
              {loading
                ? step === "email" ? "Sending…" : "Verifying…"
                : step === "email" ? "Send code" : "Verify"}
            </Text>
          </TouchableOpacity>

          {step === "code" && (
            <TouchableOpacity
              onPress={() => { setStep("email"); setCode(""); setError(null); }}
              className="items-center"
            >
              <Text className="text-sm text-[#6B6B6B]">
                ← Use a different email
              </Text>
            </TouchableOpacity>
          )}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
