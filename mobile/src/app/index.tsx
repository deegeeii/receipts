// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { Redirect } from "expo-router";

// ── REDIRECT ──────────────────────────────────────────────────────────────────
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
