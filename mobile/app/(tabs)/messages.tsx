// FR8X-CON Mobile — Messages Screen
// Lists conversations with real-time unread count.

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../../src/lib/firebase";

const COLORS = {
  bg: "#0F172A",
  surface: "#1E293B",
  border: "#334155",
  accent: "#56C5F0",
  text: "#F1F5F9",
  textMuted: "#94A3B8",
};

type Conversation = {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: { seconds: number } | string;
  otherUserName: string;
  otherUserPhotoURL: string | null;
  unreadCount: number;
};

function formatTime(ts: Conversation["lastMessageAt"]): string {
  const seconds =
    typeof ts === "string"
      ? (Date.now() - new Date(ts).getTime()) / 1000
      : Date.now() / 1000 - (ts as { seconds: number }).seconds;
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function ConversationCard({
  conv,
  onPress,
}: {
  conv: Conversation;
  onPress: () => void;
}) {
  const initials = conv.otherUserName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <TouchableOpacity style={styles.convCard} onPress={onPress} accessibilityLabel={`Message from ${conv.otherUserName}`}>
      {conv.otherUserPhotoURL ? (
        <Image source={{ uri: conv.otherUserPhotoURL }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
      )}
      <View style={styles.convInfo}>
        <View style={styles.convHeader}>
          <Text style={styles.convName} numberOfLines={1}>
            {conv.otherUserName}
          </Text>
          <Text style={styles.convTime}>{formatTime(conv.lastMessageAt)}</Text>
        </View>
        <View style={styles.convFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {conv.lastMessage}
          </Text>
          {conv.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{conv.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", uid),
        orderBy("lastMessageAt", "desc"),
        limit(30)
      );
      const snap = await getDocs(q);
      setConversations(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Conversation)
      );
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    fetchConversations().finally(() => setIsLoading(false));
  }, [fetchConversations]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchConversations();
    setIsRefreshing(false);
  }, [fetchConversations]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationCard conv={item} onPress={() => {}} />
        )}
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
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Connect with freight professionals to start messaging.
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
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, fontFamily: "Inter-Bold" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingBottom: 20 },
  separator: { height: 1, backgroundColor: COLORS.border },
  convCard: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: COLORS.surface, gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { color: "#0F172A", fontSize: 18, fontWeight: "700", fontFamily: "Inter-Bold" },
  convInfo: { flex: 1 },
  convHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  convName: { flex: 1, fontSize: 15, fontWeight: "600", color: COLORS.text, fontFamily: "Inter-SemiBold" },
  convTime: { fontSize: 11, color: COLORS.textMuted, fontFamily: "Inter-Regular", marginLeft: 8 },
  convFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  lastMessage: { flex: 1, fontSize: 13, color: COLORS.textMuted, fontFamily: "Inter-Regular" },
  unreadBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadCount: { color: "#0F172A", fontSize: 11, fontWeight: "700", fontFamily: "Inter-Bold" },
  emptyContainer: { alignItems: "center", padding: 48, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: COLORS.text, fontSize: 16, fontFamily: "Inter-SemiBold" },
  emptySubtext: { color: COLORS.textMuted, fontSize: 13, fontFamily: "Inter-Regular", textAlign: "center", lineHeight: 20 },
});
