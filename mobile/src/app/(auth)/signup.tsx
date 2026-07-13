// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { supabase } from "@/lib/supabase";

// ── SCREEN ────────────────────────────────────────────────────────────────────
export default function SignupScreen() {
  // ── STATE ─────────────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── HANDLER ───────────────────────────────────────────────────────────────
  async function handleSignup() {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim() },
      },
    });

    if (error) {
      console.error("signup: sign up failed", error);
      setError(error.message);
    }

    setLoading(false);
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-12"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-8">

            <View className="gap-1">
              <Text className="text-xs text-[#6B6B6B] uppercase tracking-widest">
                Receipt
              </Text>
              <Text className="text-2xl font-bold text-[#F0EDEA]">
                Put something on the line
              </Text>
            </View>

            <View className="gap-3">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor="#6B6B6B"
                autoCorrect={false}
                className="px-4 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] text-sm"
              />
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
              onPress={handleSignup}
              disabled={loading || !name || !email || !password}
              className="py-4 bg-[#C9A84C] rounded-md items-center disabled:opacity-40"
            >
              <Text className="text-[#0A0A0A] font-semibold text-base">
                {loading ? "Creating account…" : "Create account"}
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center gap-2">
              <Text className="text-sm text-[#6B6B6B]">
                Already have an account?
              </Text>
              <Link href="/(auth)/login">
                <Text className="text-sm text-[#C9A84C] font-semibold">
                  Sign in
                </Text>
              </Link>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
