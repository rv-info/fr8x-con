// FR8X-CON Mobile — Root Layout (Expo Router)
// Handles: auth gating, deep link routing, push notification tap navigation,
// biometric re-authentication on app foreground.

import { useEffect, useCallback } from "react";
import { Stack, useRouter, useSegments, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, AppState, type AppStateStatus } from "react-native";
import * as Font from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuth } from "../src/hooks/useAuth";
import {
  usePushNotifications,
  getLastNotificationResponse,
} from "../src/services/pushNotifications";
import type { NotificationPayload } from "../src/services/pushNotifications";
import { AppSupervisorErrorBoundary } from "../src/components/ErrorBoundary";

// Prevent splash screen auto-hide until fonts are loaded
SplashScreen.preventAutoHideAsync().catch(() => {
  /* Ignore top-level splash screen errors */
});

function useProtectedRoute(isAuthenticated: boolean, isLoading: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)/feeds");
    }
  }, [isAuthenticated, isLoading, segments, router]);
}

export default function RootLayout() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, authenticateWithBiometrics, biometricEnabled } =
    useAuth();

  // Font loading with non-fatal fallback
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          "Inter-Regular": require("./assets/fonts/Inter-Regular.ttf"),
          "Inter-Medium": require("./assets/fonts/Inter-Medium.ttf"),
          "Inter-SemiBold": require("./assets/fonts/Inter-SemiBold.ttf"),
          "Inter-Bold": require("./assets/fonts/Inter-Bold.ttf"),
        });
      } catch (err) {
        console.warn("Font loading fallback to default system fonts:", err);
      } finally {
        try {
          await SplashScreen.hideAsync();
        } catch {
          /* Ignore splash screen hide errors */
        }
      }
    }
    loadFonts();
  }, []);

  // Biometric re-auth on app foreground
  useEffect(() => {
    if (!isAuthenticated || !biometricEnabled) return;
    let lastState: AppStateStatus = AppState.currentState;
    const sub = AppState.addEventListener("change", async (next: AppStateStatus) => {
      if (lastState.match(/inactive|background/) && next === "active") {
        const authenticated = await authenticateWithBiometrics();
        if (!authenticated) {
          router.replace("/(auth)/login");
        }
      }
      lastState = next;
    });
    return () => sub.remove();
  }, [isAuthenticated, biometricEnabled, authenticateWithBiometrics, router]);

  // Handle notification tap deep-link navigation
  const handleNotificationTap = useCallback(
    (payload: NotificationPayload) => {
      const { type, entityId, route } = payload.data ?? {};
      if (route) {
        router.push(route as never);
        return;
      }
      if (type === "auction" && entityId) {
        router.push(`/(tabs)/auctions/${entityId}` as never);
      } else if (type === "message") {
        router.push("/(tabs)/messages" as never);
      } else if (type === "bid" && entityId) {
        router.push(`/(tabs)/auctions/${entityId}` as never);
      } else {
        router.push("/(tabs)/notifications" as never);
      }
    },
    [router]
  );

  // Handle notification that launched the app
  useEffect(() => {
    getLastNotificationResponse().then((response) => {
      if (response) {
        const content = response.notification.request.content;
        handleNotificationTap({
          title: content.title ?? "",
          body: content.body ?? "",
          data: content.data as NotificationPayload["data"],
        });
      }
    });
  }, [handleNotificationTap]);

  usePushNotifications(user?.uid, handleNotificationTap);
  useProtectedRoute(isAuthenticated, isLoading);

  return (
    <AppSupervisorErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style={Platform.OS === "ios" ? "dark" : "auto"} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AppSupervisorErrorBoundary>
  );
}
