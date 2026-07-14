// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StripeProvider } from "@stripe/stripe-react-native";
import { AuthProvider, useAuth } from "@/context/auth";
import "@/global.css";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const STRIPE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

// ── SPLASH ────────────────────────────────────────────────────────────────────
SplashScreen.preventAutoHideAsync();

// ── NAVIGATOR ─────────────────────────────────────────────────────────────────
function RootNavigator() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}

// ── LAYOUT ────────────────────────────────────────────────────────────────────
export default function RootLayout() {
  return (
    <StripeProvider publishableKey={STRIPE_KEY}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </StripeProvider>
  );
}
