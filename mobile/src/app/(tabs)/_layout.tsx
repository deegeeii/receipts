// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { Tabs } from "expo-router";

// ── LAYOUT ────────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0A0A0A",
          borderTopColor: "#1F1F1F",
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: "#C9A84C",
        tabBarInactiveTintColor: "#6B6B6B",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="projects" options={{ title: "Projects" }} />
      <Tabs.Screen name="ideation" options={{ title: "Ideation" }} />
      <Tabs.Screen name="journal" options={{ title: "Journal" }} />
    </Tabs>
  );
}
