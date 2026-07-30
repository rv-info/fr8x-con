// FR8X-CON Mobile — Rates Screen
// Browse and search freight rates posted by the network.

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../../src/lib/firebase";

const COLORS = {
  bg: "#0F172A",
  surface: "#1E293B",
  border: "#334155",
  accent: "#56C5F0",
  text: "#F1F5F9",
  textMuted: "#94A3B8",
  textSecondary: "#CBD5E1",
};

type Rate = {
  id: string;
  origin: string;
  destination: string;
  cargoType: string;
  containerSize: string;
  amount: number;
  currency: string;
  validUntil: string;
  postedBy: string;
  companyName: string;
  createdAt: { seconds: number } | string;
};

function RateCard({ rate }: { rate: Rate }) {
  return (
    <View style={styles.rateCard}>
      <View style={styles.routeRow}>
        <Text style={styles.port}>{rate.origin}</Text>
        <Text style={styles.arrow}>→</Text>
        <Text style={styles.port}>{rate.destination}</Text>
      </View>
      <View style={styles.rateDetails}>
        <View>
          <Text style={styles.rateValue}>
            {rate.currency} {rate.amount.toLocaleString()}
          </Text>
          <Text style={styles.rateSubtext}>
            {rate.cargoType} · {rate.containerSize}
          </Text>
        </View>
        <View style={styles.postedInfo}>
          <Text style={styles.postedBy} numberOfLines={1}>{rate.companyName}</Text>
          <Text style={styles.validUntil}>Valid until {rate.validUntil}</Text>
        </View>
      </View>
    </View>
  );
}

export default function RatesScreen() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [filtered, setFiltered] = useState<Rate[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRates = useCallback(async () => {
    try {
      const q = query(
        collection(db, "rates"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Rate);
      setRates(data);
      setFiltered(data);
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    fetchRates().finally(() => setIsLoading(false));
  }, [fetchRates]);

  const handleSearch = useCallback(
    (text: string) => {
      setSearch(text);
      if (!text.trim()) {
        setFiltered(rates);
        return;
      }
      const lower = text.toLowerCase();
      setFiltered(
        rates.filter(
          (r) =>
            r.origin.toLowerCase().includes(lower) ||
            r.destination.toLowerCase().includes(lower) ||
            r.cargoType.toLowerCase().includes(lower) ||
            r.companyName.toLowerCase().includes(lower)
        )
      );
    },
    [rates]
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchRates();
    setIsRefreshing(false);
  }, [fetchRates]);

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
        <Text style={styles.headerTitle}>Freight Rates</Text>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by port, cargo, or company..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={handleSearch}
          accessibilityLabel="Search rates"
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RateCard rate={item} />}
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
            <Text style={styles.emptyIcon}>📈</Text>
            <Text style={styles.emptyText}>No rates found</Text>
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
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, fontFamily: "Inter-Bold" },
  searchContainer: { padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    fontFamily: "Inter-Regular",
  },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingBottom: 20 },
  separator: { height: 1, backgroundColor: COLORS.border },
  rateCard: { backgroundColor: COLORS.surface, padding: 16 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  port: { color: COLORS.accent, fontSize: 14, fontWeight: "600", fontFamily: "Inter-SemiBold" },
  arrow: { color: COLORS.textMuted, fontSize: 14 },
  rateDetails: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  rateValue: { fontSize: 18, fontWeight: "700", color: COLORS.text, fontFamily: "Inter-Bold" },
  rateSubtext: { color: COLORS.textMuted, fontSize: 12, fontFamily: "Inter-Regular", marginTop: 2 },
  postedInfo: { alignItems: "flex-end" },
  postedBy: { color: COLORS.textSecondary, fontSize: 12, fontFamily: "Inter-Medium", maxWidth: 130 },
  validUntil: { color: COLORS.textMuted, fontSize: 11, fontFamily: "Inter-Regular", marginTop: 2 },
  emptyContainer: { alignItems: "center", padding: 48, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: COLORS.text, fontSize: 16, fontFamily: "Inter-SemiBold" },
});
