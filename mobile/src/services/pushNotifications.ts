// FR8X-CON Mobile — Push Notification Service
// Handles FCM push token registration, token storage in Firestore,
// notification permission requests, and deep-link navigation on tap.

import { useEffect, useRef, useCallback } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

// Configure foreground notification behaviour
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false, // silent for foreground (use badge only)
    shouldSetBadge: true,
  }),
});

export type NotificationPayload = {
  title: string;
  body: string;
  data?: {
    type?: "auction" | "message" | "bid" | "rate" | "system";
    entityId?: string;
    route?: string;
  };
};

/**
 * Register device for push notifications.
 * Returns the Expo push token string, or null if not granted.
 */
export async function registerForPushNotifications(
  userId: string
): Promise<string | null> {
  if (!Device.isDevice) {
    // Push notifications only work on physical devices
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  // Android channel setup
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "FR8X-CON Alerts",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#56C5F0",
      sound: null, // silent
    });

    await Notifications.setNotificationChannelAsync("auctions", {
      name: "Auction Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: "#F59E0B",
      sound: null,
    });
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
  });

  const pushToken = tokenResponse.data;

  // Store push token in Firestore for server-side targeting
  if (userId && pushToken) {
    try {
      await setDoc(
        doc(db, "push_tokens", `${userId}_${Platform.OS}`),
        {
          userId,
          token: pushToken,
          platform: Platform.OS,
          deviceName: Device.deviceName ?? "Unknown",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // Non-fatal: token storage failure shouldn't block auth flow
    }
  }

  return pushToken;
}

/**
 * usePushNotifications hook.
 * Registers for push, handles notification tap navigation.
 */
export function usePushNotifications(
  userId: string | undefined,
  onNotificationTap: (payload: NotificationPayload) => void
) {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const handleNotificationTap = useCallback(
    (response: Notifications.NotificationResponse) => {
      const notification = response.notification.request.content;
      onNotificationTap({
        title: notification.title ?? "",
        body: notification.body ?? "",
        data: notification.data as NotificationPayload["data"],
      });
    },
    [onNotificationTap]
  );

  useEffect(() => {
    if (!userId) return;

    // Register for push
    registerForPushNotifications(userId).catch(() => {
      // Non-fatal
    });

    // Listen for foreground notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (_notification) => {
        // Notification received in foreground — badge update handled by handler config
      }
    );

    // Listen for notification taps (background/killed)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(handleNotificationTap);

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [userId, handleNotificationTap]);

  /**
   * Clear badge count.
   */
  const clearBadge = useCallback(async () => {
    await Notifications.setBadgeCountAsync(0);
  }, []);

  return { clearBadge };
}

/**
 * Helper: get last notification response (app launched via tapped notification).
 */
export async function getLastNotificationResponse() {
  return Notifications.getLastNotificationResponseAsync();
}
