// FR8X-CON Mobile — Notifications Screen
// Shows notification history with deep-link navigation and badge clear on view.

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db, auth } from "../../src/lib/firebase";

const COLORS = {
  bg: "#0F172A",
  surface: "#1E293B",
  border: "#334155",
  accent: "#56C5F0",
  text: "#F1F5F9",
  textMuted: "#94A3B8",
  unread: "#1E3A5F",
};

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  entityId?: string;
  route?: string;
  read: boolean;
  createdAt: { seconds: number } | string;
};

function formatTime(ts: NotificationItem["createdAt"]): string {
  const seconds =
    typeof ts === "string"
      ? (Date.now() - new Date(ts).getTime()) / 1000
      : Date.now() / 1000 - (ts as { seconds: number }).seconds;
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const TYPE_ICONS: Record<string, string> = {
  auction: "🏷️",
  bid: "💰",
  message: "💬",
  rate: "📈",
  system: "🔔",
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", uid),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const snap = await getDocs(q);
      setNotifications(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as NotificationItem)
      );
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Clear badge on mount
    Notifications.setBadgeCountAsync(0);
  }, [fetchNotifications]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setIsRefreshing(false);
  }, [fetchNotifications]);

  const handleNotificationPress = useCallback(
    (item: NotificationItem) => {
      if (item.route) {
        router.push(item.route as never);
        return;
      }
      if (item.type === "auction" && item.entityId) {
        router.push(`/(tabs)/auctions/${item.entityId}` as never);
      } else if (item.type === "message") {
        router.push("/(tabs)/messages" as never);
      }
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: NotificationItem }) => (
      <TouchableOpacity
        style={[styles.notifCard, !item.read && styles.notifCardUnread]}
        onPress={() => handleNotificationPress(item)}
        accessibilityLabel={item.title}
      >
        <Text style={styles.notifIcon}>{TYPE_ICONS[item.type] ?? "🔔"}</Text>
        <View style={styles.notifContent}>
          <Text style={styles.notifTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.notifBody} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.notifTime}>{formatTime(item.createdAt)}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    ),
    [handleNotificationPress]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              You&apos;ll get alerts for auction updates, bids, messages, and more.
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    fontFamily: "Inter-Bold",
  },
  listContent: { paddingBottom: 20 },
  separator: { height: 1, backgroundColor: COLORS.border },
  notifCard: {
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    gap: 12,
  },
  notifCardUnread: { backgroundColor: COLORS.unread },
  notifIcon: { fontSize: 22, marginTop: 2 },
  notifContent: { flex: 1 },
  notifTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    marginBottom: 3,
  },
  notifBody: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "Inter-Regular",
    lineHeight: 18,
  },
  notifTime: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: "Inter-Regular",
    marginTop: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 48,
    gap: 10,
  },
  emptyIcon: { fontSize: 48 },
  emptyText: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    fontWeight: "600",
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "Inter-Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
