// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { Stack } from "expo-router";

// ── LAYOUT ────────────────────────────────────────────────────────────────────
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
