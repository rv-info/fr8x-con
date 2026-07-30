// FR8X-CON Mobile — Profile Screen
// Shows user profile with biometric settings and sign-out.

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../src/lib/firebase";
import { useAuth } from "../../src/hooks/useAuth";

const COLORS = {
  bg: "#0F172A",
  surface: "#1E293B",
  border: "#334155",
  accent: "#56C5F0",
  text: "#F1F5F9",
  textMuted: "#94A3B8",
  error: "#F87171",
  success: "#4ADE80",
};

type Profile = {
  fullName: string;
  designation: string;
  companyName: string;
  photoURL: string | null;
  verifiedBadge: boolean;
  postsCount: number;
  followersCount: number;
  followingCount: number;
};

export default function ProfileScreen() {
  const { signOut, biometricAvailable, biometricEnabled, enableBiometric } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfile = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      const snap = await getDoc(doc(db, "profiles", uid));
      if (snap.exists()) setProfile(snap.data() as Profile);
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSignOut = useCallback(() => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  }, [signOut]);

  const handleToggleBiometric = useCallback(async () => {
    if (!biometricEnabled) {
      const success = await enableBiometric();
      if (!success) {
        Alert.alert("Biometric Setup Failed", "Please try again or use email OTP.");
      }
    }
  }, [biometricEnabled, enableBiometric]);

  const initials = profile?.fullName
    ? profile.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Avatar & info */}
        <View style={styles.profileCard}>
          {profile?.photoURL ? (
            <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <Text style={styles.fullName}>{profile?.fullName ?? "—"}</Text>
          <Text style={styles.designation}>
            {profile?.designation ?? ""}
            {profile?.designation && profile?.companyName ? " · " : ""}
            {profile?.companyName ?? ""}
          </Text>
          {profile?.verifiedBadge && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Verified</Text>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.postsCount ?? 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.followersCount ?? 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.followingCount ?? 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          {biometricAvailable && (
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Biometric Login</Text>
                <Text style={styles.settingDesc}>Use Face ID / Fingerprint to unlock</Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleToggleBiometric}
                trackColor={{ false: COLORS.border, true: COLORS.accent }}
                thumbColor={biometricEnabled ? "#fff" : COLORS.textMuted}
                accessibilityLabel="Toggle biometric login"
              />
            </View>
          )}
        </View>

        {/* Email info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{auth.currentUser?.email ?? "—"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>User ID</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {auth.currentUser?.uid ?? "—"}
            </Text>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          accessibilityLabel="Sign out"
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingBottom: 40 },
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
  profileCard: {
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 12 },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarInitials: { color: "#0F172A", fontSize: 30, fontWeight: "800", fontFamily: "Inter-Bold" },
  fullName: { fontSize: 20, fontWeight: "700", color: COLORS.text, fontFamily: "Inter-Bold" },
  designation: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, fontFamily: "Inter-Regular" },
  verifiedBadge: {
    marginTop: 8,
    backgroundColor: "#1A4731",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  verifiedText: { color: COLORS.success, fontSize: 12, fontFamily: "Inter-Medium", fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 0,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "700", color: COLORS.text, fontFamily: "Inter-Bold" },
  statLabel: { fontSize: 11, color: COLORS.textMuted, fontFamily: "Inter-Regular", marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: COLORS.border },
  section: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    paddingHorizontal: 16,
    paddingVertical: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Inter-SemiBold",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, color: COLORS.text, fontFamily: "Inter-Medium", fontWeight: "500" },
  settingDesc: { fontSize: 12, color: COLORS.textMuted, fontFamily: "Inter-Regular", marginTop: 2 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  infoLabel: { fontSize: 14, color: COLORS.textMuted, fontFamily: "Inter-Regular" },
  infoValue: { fontSize: 13, color: COLORS.text, fontFamily: "Inter-Regular", maxWidth: "60%" },
  signOutButton: {
    margin: 24,
    backgroundColor: "#2D1515",
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutText: { color: COLORS.error, fontSize: 15, fontWeight: "600", fontFamily: "Inter-SemiBold" },
});
