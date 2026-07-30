// FR8X-CON Mobile — Tab Bar Layout
// Core navigation: Feeds | Auctions | Rates | Messages | Profile

import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  bg: "#0F172A",
  surface: "#1E293B",
  border: "#334155",
  accent: "#56C5F0",
  textMuted: "#64748B",
};

type TabIconName = "newspaper" | "newspaper-outline" | "gavel" | "gavel-outline" | "trending-up" | "trending-up-outline" | "chatbubbles" | "chatbubbles-outline" | "person" | "person-outline" | "notifications" | "notifications-outline";

function TabIcon({ name, color }: { name: TabIconName; size: number; color: string }) {
  return <Ionicons name={name} size={22} color={color} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === "ios" ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === "ios" ? 80 : 60,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Inter-Medium",
        },
      }}
    >
      <Tabs.Screen
        name="feeds"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? "newspaper" : "newspaper-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="auctions/index"
        options={{
          title: "Auctions",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? "gavel" : "gavel-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rates"
        options={{
          title: "Rates",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? "trending-up" : "trending-up-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? "chatbubbles" : "chatbubbles-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? "notifications" : "notifications-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? "person" : "person-outline"} size={size} color={color} />
          ),
        }}
      />
      {/* Hidden screens (navigated to from deep links/notifications) */}
      <Tabs.Screen name="auctions/[id]" options={{ href: null }} />
    </Tabs>
  );
}
