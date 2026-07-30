// FR8X-CON Mobile — Feeds Screen
// Real-time post feed from Firestore with pull-to-refresh.

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, query, orderBy, limit, getDocs, type QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "../../src/lib/firebase";

const COLORS = {
  bg: "#0F172A",
  surface: "#1E293B",
  surfaceAlt: "#162032",
  border: "#334155",
  accent: "#56C5F0",
  text: "#F1F5F9",
  textMuted: "#94A3B8",
  textSecondary: "#CBD5E1",
  success: "#4ADE80",
};

type FeedPost = {
  id: string;
  content: string;
  authorName: string;
  authorCompany: string;
  authorDesignation: string;
  authorPhotoURL: string | null;
  category: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  createdAt: { seconds: number } | string;
};

function formatRelativeTime(ts: FeedPost["createdAt"]): string {
  const seconds =
    typeof ts === "string"
      ? (Date.now() - new Date(ts).getTime()) / 1000
      : Date.now() / 1000 - (ts as { seconds: number }).seconds;

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function PostCard({ post }: { post: FeedPost }) {
  const initials = post.authorName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        {post.authorPhotoURL ? (
          <Image source={{ uri: post.authorPhotoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
        <View style={styles.authorInfo}>
          <Text style={styles.authorName} numberOfLines={1}>
            {post.authorName}
          </Text>
          <Text style={styles.authorMeta} numberOfLines={1}>
            {post.authorDesignation}
            {post.authorDesignation && post.authorCompany ? " · " : ""}
            {post.authorCompany}
          </Text>
          <Text style={styles.postTime}>{formatRelativeTime(post.createdAt)}</Text>
        </View>
      </View>

      <Text style={styles.postContent}>{post.content.replace(/<[^>]+>/g, "")}</Text>

      {post.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {post.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionBtn} accessibilityLabel="Like post">
          <Text style={styles.actionIcon}>👍</Text>
          <Text style={styles.actionCount}>{post.likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} accessibilityLabel="Comment on post">
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{post.commentsCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} accessibilityLabel="Repost">
          <Text style={styles.actionIcon}>🔁</Text>
          <Text style={styles.actionCount}>{post.repostsCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function FeedsScreen() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const q = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        limit(30)
      );
      const snap = await getDocs(q);
      const fetched = snap.docs.map((doc: QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data(),
      })) as FeedPost[];
      setPosts(fetched);
    } catch {
      // Non-fatal: keep existing posts on failure
    }
  }, []);

  useEffect(() => {
    fetchPosts().finally(() => setIsLoading(false));
  }, [fetchPosts]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchPosts();
    setIsRefreshing(false);
  }, [fetchPosts]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.accent} size="large" />
          <Text style={styles.loadingText}>Loading feed...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FR8X-CON</Text>
        <Text style={styles.headerSubtitle}>Freight Network Feed</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={styles.listContent}
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
            <Text style={styles.emptyText}>No posts yet.</Text>
            <Text style={styles.emptySubtext}>
              Be the first to share with the network!
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.accent,
    fontFamily: "Inter-Bold",
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: "Inter-Regular",
  },
  listContent: { paddingBottom: 20 },
  separator: { height: 1, backgroundColor: COLORS.border },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { color: COLORS.textMuted, fontFamily: "Inter-Regular", fontSize: 14 },
  postCard: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  postHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10 },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarInitials: { color: "#0F172A", fontWeight: "700", fontSize: 16, fontFamily: "Inter-Bold" },
  authorInfo: { flex: 1 },
  authorName: { color: COLORS.text, fontWeight: "600", fontSize: 14, fontFamily: "Inter-SemiBold" },
  authorMeta: { color: COLORS.textMuted, fontSize: 12, marginTop: 1, fontFamily: "Inter-Regular" },
  postTime: { color: COLORS.textMuted, fontSize: 11, marginTop: 2, fontFamily: "Inter-Regular" },
  postContent: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
    fontFamily: "Inter-Regular",
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  tag: {
    backgroundColor: "#1E3A5F",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: { color: COLORS.accent, fontSize: 11, fontFamily: "Inter-Medium" },
  postActions: {
    flexDirection: "row",
    gap: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionIcon: { fontSize: 16 },
  actionCount: { color: COLORS.textMuted, fontSize: 13, fontFamily: "Inter-Regular" },
  emptyContainer: { alignItems: "center", padding: 40, gap: 8 },
  emptyText: { color: COLORS.text, fontSize: 16, fontFamily: "Inter-SemiBold" },
  emptySubtext: { color: COLORS.textMuted, fontSize: 14, fontFamily: "Inter-Regular", textAlign: "center" },
});
