// FR8X-CON Mobile — Auctions Screen
// Lists active reverse auctions from Firestore with real-time countdown.

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../../../src/lib/firebase";

const COLORS = {
  bg: "#0F172A",
  surface: "#1E293B",
  border: "#334155",
  accent: "#56C5F0",
  text: "#F1F5F9",
  textMuted: "#94A3B8",
  warning: "#F59E0B",
  success: "#4ADE80",
  danger: "#F87171",
};

type Auction = {
  id: string;
  title: string;
  description: string;
  origin: string;
  destination: string;
  cargoType: string;
  currentLowestBid: number | null;
  currency: string;
  bidsCount: number;
  status: "active" | "closed" | "awarded";
  endsAt: { seconds: number } | string;
  createdAt: { seconds: number } | string;
};

function getTimeRemaining(endsAt: Auction["endsAt"]): string {
  const endSeconds =
    typeof endsAt === "string"
      ? new Date(endsAt).getTime() / 1000
      : (endsAt as { seconds: number }).seconds;
  const remaining = endSeconds - Date.now() / 1000;
  if (remaining <= 0) return "Closed";
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function AuctionCard({ auction, onPress }: { auction: Auction; onPress: () => void }) {
  const timeRemaining = getTimeRemaining(auction.endsAt);
  const isUrgent = timeRemaining !== "Closed" && !timeRemaining.includes("d");

  return (
    <TouchableOpacity style={styles.auctionCard} onPress={onPress} accessibilityLabel={auction.title}>
      <View style={styles.auctionHeader}>
        <View style={styles.routeRow}>
          <Text style={styles.port}>{auction.origin}</Text>
          <Text style={styles.arrow}>→</Text>
          <Text style={styles.port}>{auction.destination}</Text>
        </View>
        <View style={[styles.timeBadge, isUrgent && styles.timeBadgeUrgent]}>
          <Text style={[styles.timeText, isUrgent && styles.timeTextUrgent]}>
            ⏱ {timeRemaining}
          </Text>
        </View>
      </View>

      <Text style={styles.auctionTitle} numberOfLines={2}>
        {auction.title}
      </Text>

      <View style={styles.auctionMeta}>
        <Text style={styles.cargoType}>{auction.cargoType}</Text>
        <View style={styles.bidInfo}>
          {auction.currentLowestBid ? (
            <>
              <Text style={styles.bidLabel}>Lowest Bid: </Text>
              <Text style={styles.bidValue}>
                {auction.currency} {auction.currentLowestBid.toLocaleString()}
              </Text>
            </>
          ) : (
            <Text style={styles.noBids}>No bids yet</Text>
          )}
        </View>
      </View>

      <Text style={styles.bidsCount}>{auction.bidsCount} bids</Text>
    </TouchableOpacity>
  );
}

export default function AuctionsScreen() {
  const router = useRouter();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAuctions = useCallback(async () => {
    try {
      const q = query(
        collection(db, "auctions"),
        where("status", "==", "active"),
        orderBy("endsAt", "asc"),
        limit(30)
      );
      const snap = await getDocs(q);
      setAuctions(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Auction));
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    fetchAuctions().finally(() => setIsLoading(false));
  }, [fetchAuctions]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchAuctions();
    setIsRefreshing(false);
  }, [fetchAuctions]);

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
        <Text style={styles.headerTitle}>Auctions</Text>
        <Text style={styles.headerSubtitle}>{auctions.length} active RFQs</Text>
      </View>

      <FlatList
        data={auctions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AuctionCard
            auction={item}
            onPress={() => router.push(`/(tabs)/auctions/${item.id}` as never)}
          />
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
            <Text style={styles.emptyIcon}>🏷️</Text>
            <Text style={styles.emptyText}>No active auctions</Text>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, fontFamily: "Inter-Bold" },
  headerSubtitle: { fontSize: 12, color: COLORS.textMuted, fontFamily: "Inter-Regular", marginTop: 2 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingBottom: 20 },
  separator: { height: 1, backgroundColor: COLORS.border },
  auctionCard: { backgroundColor: COLORS.surface, padding: 16 },
  auctionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  port: { color: COLORS.accent, fontSize: 13, fontWeight: "600", fontFamily: "Inter-SemiBold" },
  arrow: { color: COLORS.textMuted, fontSize: 13 },
  timeBadge: { backgroundColor: "#1E293B", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.border },
  timeBadgeUrgent: { borderColor: COLORS.warning },
  timeText: { color: COLORS.textMuted, fontSize: 11, fontFamily: "Inter-Medium" },
  timeTextUrgent: { color: COLORS.warning },
  auctionTitle: { color: COLORS.text, fontSize: 14, fontWeight: "600", fontFamily: "Inter-SemiBold", marginBottom: 10, lineHeight: 20 },
  auctionMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cargoType: { color: COLORS.textMuted, fontSize: 12, fontFamily: "Inter-Regular" },
  bidInfo: { flexDirection: "row", alignItems: "center" },
  bidLabel: { color: COLORS.textMuted, fontSize: 13, fontFamily: "Inter-Regular" },
  bidValue: { color: COLORS.success, fontSize: 13, fontWeight: "600", fontFamily: "Inter-SemiBold" },
  noBids: { color: COLORS.textMuted, fontSize: 12, fontFamily: "Inter-Regular" },
  bidsCount: { color: COLORS.textMuted, fontSize: 11, fontFamily: "Inter-Regular" },
  emptyContainer: { alignItems: "center", padding: 48, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: COLORS.text, fontSize: 16, fontFamily: "Inter-SemiBold" },
});
