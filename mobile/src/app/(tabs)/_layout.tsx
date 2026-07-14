// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { Tabs, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ── LAYOUT ────────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  const router = useRouter();

  function GearButton() {
    return (
      <TouchableOpacity
        onPress={() => router.push("/settings")}
        style={{ marginRight: 16 }}
      >
        <Ionicons
          name="settings-outline"
          size={22}
          color="#6B6B6B"
        />
      </TouchableOpacity>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#0A0A0A" },
        headerTintColor: "#F0EDEA",
        headerTitleStyle: { fontWeight: "600" },
        headerShadowVisible: false,
        headerRight: () => <GearButton />,
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
