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
import { Link } from "expo-router";
import { supabase } from "@/lib/supabase";

// ── SCREEN ────────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  // ── STATE ─────────────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── HANDLER ───────────────────────────────────────────────────────────────
  async function handleLogin() {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      console.error("login: sign in failed", error);
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
              Welcome back
            </Text>
          </View>

          <View className="gap-3">
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
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#6B6B6B"
              secureTextEntry
              className="px-4 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] text-sm"
            />
            {error && (
              <Text className="text-sm text-[#7B2D2D]">{error}</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading || !email || !password}
            className="py-4 bg-[#C9A84C] rounded-md items-center disabled:opacity-40"
          >
            <Text className="text-[#0A0A0A] font-semibold text-base">
              {loading ? "Signing in…" : "Sign in"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center gap-2">
            <Text className="text-sm text-[#6B6B6B]">No account?</Text>
            <Link href="/(auth)/signup">
              <Text className="text-sm text-[#C9A84C] font-semibold">
                Sign up
              </Text>
            </Link>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
