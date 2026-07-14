// ── IMPORTS ───────────────────────────────────────────────────────────────────
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { apiPost } from "@/lib/api";

// ── REGISTER ──────────────────────────────────────────────────────────────────
export async function registerForPushNotifications(): Promise<void> {
  if (!Device.isDevice) {
    console.log("notifications: skipping — not a physical device");
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("notifications: permission denied");
    return;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId;

  if (!projectId) {
    console.error("notifications: no EAS project ID in app config");
    return;
  }

  let token: string;
  try {
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (err) {
    console.error("notifications: getExpoPushTokenAsync failed", err);
    return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { error } = await apiPost("/api/push/register", { token });
  if (error) {
    console.error("notifications: token registration failed", error);
  }
}
